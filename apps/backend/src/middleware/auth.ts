import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { organisationsCollection, adminUsersCollection, superAdminUsersCollection } from "../services/mongodb-wrapper";
import { AuthUser } from "../types";

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

// JWT token validation middleware
export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({
            success: false,
            error: "Access token required",
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        console.log(`[DEBUG] authenticateToken - Decoded token:`, {
            uid: decoded.uid,
            email: decoded.email,
            organisationId: decoded.organisationId,
            role: decoded.role
        });

        // Set user from decoded token (no Firebase Auth verification needed)
        req.user = {
            id: decoded.uid,
            email: decoded.email,
            organisationId: decoded.organisationId,
            role: decoded.role,
        };

        console.log(`[DEBUG] authenticateToken - req.user set:`, req.user);

        return next();
    } catch (error) {
        console.error(`[ERROR] authenticateToken - Token verification failed:`, error);
        res.status(403).json({
            success: false,
            error: "Invalid token",
        });
        return;
    }
};

// Admin role validation middleware
export const requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: "Authentication required",
        });
        return;
    }

    if (req.user.role !== "admin") {
        res.status(403).json({
            success: false,
            error: "Admin access required",
        });
        return;
    }

    // Verify admin status in database
    try {
        const adminDoc = await adminUsersCollection.doc(req.user.id).get();

        if (!adminDoc.exists) {
            res.status(403).json({
                success: false,
                error: "Admin access required",
            });
            return;
        }

        return next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Error verifying admin status",
        });
        return;
    }
};

// Super Admin role validation middleware
export const requireSuperAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: "Authentication required",
        });
        return;
    }

    if (req.user.role !== "super_admin") {
        res.status(403).json({
            success: false,
            error: "Super admin access required",
        });
        return;
    }

    // Verify super admin status in database
    try {
        // Query by firebaseUid since that's how we store the reference
        const superAdminQuery = await superAdminUsersCollection
            .where("firebaseUid", "==", req.user.id)
            .limit(1)
            .get();

        if (superAdminQuery.empty) {
            res.status(403).json({
                success: false,
                error: "Super admin access required",
            });
            return;
        }

        return next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Error verifying super admin status",
        });
        return;
    }
};

// Organisation role validation middleware
export const requireOrganisation = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: "Authentication required",
        });
        return;
    }

    if (req.user.role !== "organisation") {
        res.status(403).json({
            success: false,
            error: "Organisation access required",
        });
        return;
    }

    // Verify organisation exists and is approved
    try {
        console.log(`[DEBUG] requireOrganisation - Checking orgId: ${req.user.organisationId}, email: ${req.user.email}`);
        
        let orgDoc;
        let orgId: string | undefined;
        
        // Try to find organisation by ID first
        if (req.user.organisationId) {
            orgDoc = await organisationsCollection.doc(req.user.organisationId).get();
            if (orgDoc.exists) {
                orgId = req.user.organisationId;
            }
        }
        
        // If not found by ID, try to find by email (fallback for old/incorrect tokens)
        if (!orgDoc || !orgDoc.exists) {
            console.log(`[DEBUG] requireOrganisation - Organisation not found by ID, trying primary email lookup`);
            let orgQuery = await organisationsCollection
                .where("contactEmail", "==", req.user.email)
                .limit(1)
                .get();

            if (orgQuery.empty) {
                console.log(`[DEBUG] requireOrganisation - Primary email lookup failed, trying legacy contact.email field`);
                orgQuery = await organisationsCollection
                    .where("contact.email", "==", req.user.email)
                    .limit(1)
                    .get();
            }
            
            if (!orgQuery.empty) {
                orgDoc = orgQuery.docs[0];
                orgId = orgDoc.id;
                console.log(`[DEBUG] requireOrganisation - Found organisation by email: ${orgId}`);
                // Update req.user with correct organisationId
                req.user.organisationId = orgId;
            }
        }

        if (!orgDoc || !orgDoc.exists || !orgId) {
            console.error(`[ERROR] requireOrganisation - Organisation not found for email: ${req.user.email}`);
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }

        const orgData = orgDoc.data();
        console.log(`[DEBUG] requireOrganisation - Org status: ${orgData?.status}, orgId: ${orgId}`);
        
        if (orgData?.status === "suspended") {
            res.status(403).json({
                success: false,
                error: "Your account is suspended. Please contact support at contact@wbf.com",
            });
            return;
        }
        if (orgData?.status !== "approved") {
            console.error(`[ERROR] requireOrganisation - Organisation not approved. Status: ${orgData?.status}`);
            res.status(403).json({
                success: false,
                error: "Organisation not approved",
            });
            return;
        }

        return next();
    } catch (error) {
        console.error(`[ERROR] requireOrganisation - Error verifying organisation:`, error);
        res.status(500).json({
            success: false,
            error: "Error verifying organisation status",
        });
        return;
    }
};

// Optional authentication middleware - doesn't fail if no token, but populates req.user if token is valid
export const optionalAuthenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        // No token provided - continue without authentication
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Set user from decoded token (no Firebase Auth verification needed)
        req.user = {
            id: decoded.uid,
            email: decoded.email,
            organisationId: decoded.organisationId,
            role: decoded.role,
        };

        return next();
    } catch (error) {
        // Invalid token - continue without authentication
        console.error(`[WARN] optionalAuthenticateToken - Token verification failed:`, error);
        return next();
    }
};

// Organisation role validation middleware for profile completion (allows draft/pending status)
export const requireOrganisationForProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: "Authentication required",
        });
        return;
    }

    if (req.user.role !== "organisation") {
        res.status(403).json({
            success: false,
            error: "Organisation access required",
        });
        return;
    }

    try {
        let orgDoc;
        let orgId = req.user.organisationId;

        if (orgId) {
            orgDoc = await organisationsCollection.doc(orgId).get();
        }

        if (!orgDoc || !orgDoc.exists) {
            console.log(`[DEBUG] requireOrganisationForProfile - Organisation not found by ID, trying primary email lookup`);
            let orgQuery = await organisationsCollection
                .where("contactEmail", "==", req.user.email)
                .limit(1)
                .get();

            if (orgQuery.empty) {
                console.log(`[DEBUG] requireOrganisationForProfile - Primary email lookup failed, trying legacy contact.email field`);
                orgQuery = await organisationsCollection
                    .where("contact.email", "==", req.user.email)
                    .limit(1)
                    .get();
            }

            if (!orgQuery.empty) {
                orgDoc = orgQuery.docs[0];
                orgId = orgDoc.id;
                req.user.organisationId = orgId;
                console.log(`[DEBUG] requireOrganisationForProfile - Found organisation by email: ${orgId}`);
            }
        }

        if (!orgDoc || !orgDoc.exists || !orgId) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }

        // Allow draft, pending, and approved status for profile completion
        const orgData = orgDoc.data();
        if (orgData?.status && !["draft", "pending", "approved"].includes(orgData.status)) {
            res.status(403).json({
                success: false,
                error: "Organisation status not allowed for this action",
            });
            return;
        }

        return next();
    } catch (error) {
        console.error(`[ERROR] requireOrganisationForProfile - Error verifying organisation:`, error);
        res.status(500).json({
            success: false,
            error: "Error verifying organisation status",
        });
        return;
    }
};