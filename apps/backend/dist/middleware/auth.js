"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOrganisationForProfile = exports.optionalAuthenticateToken = exports.requireOrganisation = exports.requireSuperAdmin = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongodb_wrapper_1 = require("../services/mongodb-wrapper");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({
            success: false,
            error: "Access token required",
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log(`[DEBUG] authenticateToken - Decoded token:`, {
            uid: decoded.uid,
            email: decoded.email,
            organisationId: decoded.organisationId,
            role: decoded.role
        });
        req.user = {
            id: decoded.uid,
            email: decoded.email,
            organisationId: decoded.organisationId,
            role: decoded.role,
        };
        console.log(`[DEBUG] authenticateToken - req.user set:`, req.user);
        return next();
    }
    catch (error) {
        console.error(`[ERROR] authenticateToken - Token verification failed:`, error);
        res.status(403).json({
            success: false,
            error: "Invalid token",
        });
        return;
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = async (req, res, next) => {
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
    try {
        const adminDoc = await mongodb_wrapper_1.adminUsersCollection.doc(req.user.id).get();
        if (!adminDoc.exists) {
            res.status(403).json({
                success: false,
                error: "Admin access required",
            });
            return;
        }
        return next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Error verifying admin status",
        });
        return;
    }
};
exports.requireAdmin = requireAdmin;
const requireSuperAdmin = async (req, res, next) => {
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
    try {
        const superAdminQuery = await mongodb_wrapper_1.superAdminUsersCollection
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Error verifying super admin status",
        });
        return;
    }
};
exports.requireSuperAdmin = requireSuperAdmin;
const requireOrganisation = async (req, res, next) => {
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
        console.log(`[DEBUG] requireOrganisation - Checking orgId: ${req.user.organisationId}, email: ${req.user.email}`);
        let orgDoc;
        let orgId;
        if (req.user.organisationId) {
            orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(req.user.organisationId).get();
            if (orgDoc.exists) {
                orgId = req.user.organisationId;
            }
        }
        if (!orgDoc || !orgDoc.exists) {
            console.log(`[DEBUG] requireOrganisation - Organisation not found by ID, trying primary email lookup`);
            let orgQuery = await mongodb_wrapper_1.organisationsCollection
                .where("contactEmail", "==", req.user.email)
                .limit(1)
                .get();
            if (orgQuery.empty) {
                console.log(`[DEBUG] requireOrganisation - Primary email lookup failed, trying legacy contact.email field`);
                orgQuery = await mongodb_wrapper_1.organisationsCollection
                    .where("contact.email", "==", req.user.email)
                    .limit(1)
                    .get();
            }
            if (!orgQuery.empty) {
                orgDoc = orgQuery.docs[0];
                orgId = orgDoc.id;
                console.log(`[DEBUG] requireOrganisation - Found organisation by email: ${orgId}`);
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
    }
    catch (error) {
        console.error(`[ERROR] requireOrganisation - Error verifying organisation:`, error);
        res.status(500).json({
            success: false,
            error: "Error verifying organisation status",
        });
        return;
    }
};
exports.requireOrganisation = requireOrganisation;
const optionalAuthenticateToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.uid,
            email: decoded.email,
            organisationId: decoded.organisationId,
            role: decoded.role,
        };
        return next();
    }
    catch (error) {
        console.error(`[WARN] optionalAuthenticateToken - Token verification failed:`, error);
        return next();
    }
};
exports.optionalAuthenticateToken = optionalAuthenticateToken;
const requireOrganisationForProfile = async (req, res, next) => {
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
            orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(orgId).get();
        }
        if (!orgDoc || !orgDoc.exists) {
            console.log(`[DEBUG] requireOrganisationForProfile - Organisation not found by ID, trying primary email lookup`);
            let orgQuery = await mongodb_wrapper_1.organisationsCollection
                .where("contactEmail", "==", req.user.email)
                .limit(1)
                .get();
            if (orgQuery.empty) {
                console.log(`[DEBUG] requireOrganisationForProfile - Primary email lookup failed, trying legacy contact.email field`);
                orgQuery = await mongodb_wrapper_1.organisationsCollection
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
        const orgData = orgDoc.data();
        if (orgData?.status && !["draft", "pending", "approved"].includes(orgData.status)) {
            res.status(403).json({
                success: false,
                error: "Organisation status not allowed for this action",
            });
            return;
        }
        return next();
    }
    catch (error) {
        console.error(`[ERROR] requireOrganisationForProfile - Error verifying organisation:`, error);
        res.status(500).json({
            success: false,
            error: "Error verifying organisation status",
        });
        return;
    }
};
exports.requireOrganisationForProfile = requireOrganisationForProfile;
//# sourceMappingURL=auth.js.map