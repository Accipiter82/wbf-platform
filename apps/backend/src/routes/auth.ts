import { Router, Request, Response } from "express";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { organisationsCollection, db, emailVerificationsCollection, superAdminUsersCollection } from "../services/mongodb-wrapper";
import { authenticateToken } from "../middleware/auth";
import { sendVerificationEmail } from "../utils/email";
import { verificationStorage } from "../utils/verificationStorage";
import {
    ApiResponse,
    LoginRequest,
    RegisterStep1Request,
    RegisterStep2Request,
    Organisation,
    SuperAdminLoginRequest,
    AdminUser
} from "../types";
import { groupOrganisationData } from "./organisation";

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
    contactEmail: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const superAdminLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const simpleRegistrationSchema = Joi.object({
    organisationName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().min(8).optional().allow(''),
});

const emailVerificationSchema = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).optional(),
});

const phoneVerificationSchema = Joi.object({
    phone: Joi.string().min(8).required(),
    code: Joi.string().length(6).optional(),
});

const registerStep1Schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    nameLocal: Joi.string().min(2).max(100).required(),
    contractingParty: Joi.string().required(),
    city: Joi.string().required(),
    postalAddress: Joi.string().required(),
    type: Joi.string().required(),
    yearOfEstablishment: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
    registrationNumber: Joi.string().optional().allow(''),
    numberOfStaff: Joi.number().integer().optional(),
    numberOfVolunteers: Joi.number().integer().optional(),
    missionFields: Joi.array().items(Joi.string()).optional(),
    website: Joi.string().uri().optional().allow(''),
    socialMediaProfiles: Joi.array().items(Joi.string().uri()).optional(),
    contactPersonName: Joi.string().required(),
    contactPersonPosition: Joi.string().optional().allow(''),
    contactEmail: Joi.string().email().required(),
    contactPhone: Joi.string().optional().allow(''),
});

const registerStep2Schema = Joi.object({
    wbfCallsApplied: Joi.array().items(Joi.object({
        callNumber: Joi.string().required(),
        year: Joi.number().integer().required(),
    })).optional(),
    roleInPastApplications: Joi.array().items(Joi.string().valid('Lead', 'Partner')).optional(),
    projectTitles: Joi.array().items(Joi.string()).optional(),
    projectDescriptions: Joi.array().items(Joi.string()).optional(),
    projectThematicAreas: Joi.array().items(Joi.string()).optional(),
    geographicalCoverage: Joi.array().items(Joi.string()).optional(),
    lookingForPartnersInThematicAreas: Joi.array().items(Joi.string()).optional(),
    lookingForPartnersFromCPs: Joi.array().items(Joi.string()).optional(),
    preferredRole: Joi.array().items(Joi.string().valid('Lead', 'Partner', 'Either')).optional(),
    expertiseOffered: Joi.array().items(Joi.string()).optional(),
    expertiseSought: Joi.array().items(Joi.string()).optional(),
    keywords: Joi.array().items(Joi.string()).optional(),
    availableResources: Joi.array().items(Joi.string()).optional(),
    referenceProjects: Joi.array().items(Joi.string()).optional(),
    successStories: Joi.array().items(Joi.string()).optional(),
    logo: Joi.string().optional(),
});

// POST /auth/send-email-verification
router.post("/send-email-verification", async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { error, value } = emailVerificationSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }

        const { email } = value;

        // Check if email already exists in organisations
        const existingOrgQuery = await organisationsCollection
            .where("contactEmail", "==", email)
            .limit(1)
            .get();
        
        if (!existingOrgQuery.empty) {
            res.status(409).json({
                success: false,
                error: "An account with this email already exists",
            });
            return;
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

        // Store verification code in Firestore (upsert)
        await emailVerificationsCollection.doc(email).set({
            code: verificationCode,
            createdAt: now,
            expiresAt: expiresAt,
            verified: false,
        });

        // Send verification email using Nodemailer
        try {
            await sendVerificationEmail(email, verificationCode);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            res.status(500).json({
                success: false,
                error: "Failed to send verification email",
            });
            return;
        }

        res.json({
            success: true,
            data: {
                message: "Verification code sent to your email",
            },
        });
        return;
    } catch (error: any) {
        console.error("Send email verification error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to send verification email",
        });
        return;
    }
});

// POST /auth/verify/email
router.post("/verify/email", async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { error, value } = emailVerificationSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }

        const { email, code } = value;

        if (!code) {
            res.status(400).json({
                success: false,
                error: "Verification code required",
            });
            return;
        }

        // Get stored verification code from Firestore
        const doc = await emailVerificationsCollection.doc(email).get();
        if (!doc.exists) {
            res.status(400).json({
                success: false,
                error: "No verification code found. Please request a new one.",
            });
            return;
        }
        const verificationData = doc.data() as any | undefined;
        if (!verificationData || verificationData.code !== code) {
            res.status(400).json({
                success: false,
                error: "Invalid verification code",
            });
            return;
        }
        // Robustly handle Firestore Timestamp or JS Date
        let expiresAt: Date | undefined = verificationData?.expiresAt;
        if (verificationData?.expiresAt && typeof verificationData.expiresAt.toDate === 'function') {
            expiresAt = verificationData.expiresAt.toDate();
        }
        if (!expiresAt || new Date() > expiresAt) {
            res.status(400).json({
                success: false,
                error: "Verification code expired. Please request a new one.",
            });
            return;
        }

        // Mark email as verified in Firestore
        await emailVerificationsCollection.doc(email).update({
            verified: true,
            verifiedAt: new Date(),
        });

        // Email verification is now handled in MongoDB only

        res.json({
            success: true,
            data: {
                message: "Email verified successfully",
            },
        });
        return;
    } catch (error: any) {
        console.error("Verify email error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to verify email",
        });
        return;
    }
});

// POST /auth/send-phone-verification
router.post("/send-phone-verification", async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { error, value } = phoneVerificationSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }

        const { phone } = value;
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store verification code using in-memory storage
        await verificationStorage.setPhoneVerification(phone, verificationCode);

        // In production, integrate with SMS service like Twilio
        // For now, just log the code
        console.log(`SMS verification code for ${phone}: ${verificationCode}`);

        res.json({
            success: true,
            data: {
                message: "Verification code sent to your phone",
            },
        });
        return;
    } catch (error: any) {
        console.error("Send phone verification error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to send verification SMS",
        });
        return;
    }
});

// POST /auth/verify/phone
router.post("/verify/phone", async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { error, value } = phoneVerificationSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }

        const { phone, code } = value;

        if (!code) {
            res.status(400).json({
                success: false,
                error: "Verification code required",
            });
            return;
        }

        // Get stored verification code from in-memory storage
        const verificationData = await verificationStorage.getPhoneVerification(phone);

        if (!verificationData) {
            res.status(400).json({
                success: false,
                error: "No verification code found. Please request a new one.",
            });
            return;
        }

        if (verificationData.code !== code) {
            res.status(400).json({
                success: false,
                error: "Invalid verification code",
            });
            return;
        }

        // Mark phone as verified
        await verificationStorage.updatePhoneVerification(phone, {
            verified: true,
            verifiedAt: new Date(),
        });

        res.json({
            success: true,
            data: {
                message: "Phone verified successfully",
            },
        });
        return;
    } catch (error: any) {
        console.error("Verify phone error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to verify phone",
        });
        return;
    }
});

// POST /auth/register/simple
router.post("/register/simple", async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { error, value } = simpleRegistrationSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }

        const { organisationName, email, password, phone } = value;

        // Check if email is verified in Firestore
        const emailVerificationDoc = await emailVerificationsCollection.doc(email).get();

        if (!emailVerificationDoc.exists) {
            res.status(400).json({
                success: false,
                error: "Email verification not found. Please verify your email first.",
            });
            return;
        }

        const emailVerification = emailVerificationDoc.data();
        if (!emailVerification || !emailVerification.verified) {
            res.status(400).json({
                success: false,
                error: "Email must be verified before registration",
            });
            return;
        }

        // Check if organisation already exists
        const existingOrg = await organisationsCollection
            .where("contactEmail", "==", email)
            .limit(1)
            .get();

        if (!existingOrg.empty) {
            res.status(409).json({
                success: false,
                error: "Organisation with this email already exists",
            });
            return;
        }

        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // User account is now stored in MongoDB only (no Firebase Auth needed)

        // Create organisation record
        const orgId = uuidv4();
        const now = new Date();

        const organisationData: Partial<Organisation> = {
            name: organisationName,
            contactEmail: email,
            contactPhone: phone || "",
            status: "draft",
            emailVerified: true,
            phoneVerified: false,
            passwordHash: hashedPassword,
            firebaseUid: orgId, // Use orgId as uid since we're not using Firebase Auth
            createdAt: now,
            updatedAt: now,
        };

        await organisationsCollection.doc(orgId).set(organisationData);

        // Generate JWT token
        const token = jwt.sign(
            {
                uid: orgId,
                email: email,
                organisationId: orgId,
                role: "organisation",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: orgId,
                    email: email,
                    organisationId: orgId,
                    role: "organisation",
                },
                organisation: {
                    ...organisationData,
                    id: orgId,
                },
                message: "Registration completed successfully. Please complete your profile.",
            },
        });
        return;
    } catch (error: any) {
        console.error("Simple registration error:", error);
        res.status(500).json({
            success: false,
            error: "Registration failed",
        });
        return;
    }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }

        const { contactEmail, password }: LoginRequest = value;

        // Get organisation data by email
        const orgQuery = await organisationsCollection
            .where("contactEmail", "==", contactEmail)
            .limit(1)
            .get();

        if (orgQuery.empty) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }

        const orgDoc = orgQuery.docs[0];
        const orgData = orgDoc.data() as Organisation;

        // Check if organisation is suspended
        if (orgData.status === "suspended") {
            res.status(403).json({
                success: false,
                error: "Your account is suspended. Please contact support at contact@wbf.com",
            });
            return;
        }

        // Debug logging to see what fields are present during login
        console.log('[DEBUG] /auth/login - Organisation data fields:', {
            hasLogo: !!orgData.logo,
            hasCover: !!orgData.cover,
            logo: orgData.logo,
            cover: orgData.cover,
            allFields: Object.keys(orgData)
        });

        // Verify password
        if (!orgData.passwordHash) {
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password || '', orgData.passwordHash || '');
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }

        // Update login tracking
        const now = new Date();
        await organisationsCollection.doc(orgDoc.id).update({
            lastLoginAt: now,
            loginCount: (orgData.loginCount || 0) + 1,
        });

        // Generate JWT token
        const token = jwt.sign(
            {
                uid: orgData.firebaseUid || orgDoc.id,
                email: contactEmail,
                organisationId: orgDoc.id,
                role: "organisation",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: orgData.firebaseUid || orgDoc.id,
                    email: contactEmail,
                    organisationId: orgDoc.id,
                    role: "organisation",
                },
                organisation: groupOrganisationData(orgData, orgDoc.id),
            },
        });
        return;
    } catch (error: any) {
        console.error("Login error:", error);
        res.status(401).json({
            success: false,
            error: "Invalid credentials",
        });
        return;
    }
});

// POST /auth/register/step-1
router.post("/register/step-1", async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { error, value } = registerStep1Schema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }

        const { name, nameLocal, contractingParty, city, postalAddress, type, yearOfEstablishment, registrationNumber, numberOfStaff, numberOfVolunteers, missionFields, website, socialMediaProfiles, contactPersonName, contactPersonPosition, contactEmail, contactPhone }: RegisterStep1Request = value;

        // Check if organisation already exists
        const existingOrg = await organisationsCollection
            .where("email", "==", contactEmail)
            .limit(1)
            .get();

        if (!existingOrg.empty) {
            res.status(400).json({
                success: false,
                error: "Organisation with this email already exists",
            });
            return;
        }

        // Generate verification codes
        const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create organisation draft
        const orgId = uuidv4();
        const now = new Date();

        const organisationData: Partial<Organisation> = {
            name,
            nameLocal,
            contractingParty,
            city,
            postalAddress,
            type,
            yearOfEstablishment,
            registrationNumber,
            numberOfStaff,
            numberOfVolunteers,
            missionFields,
            website,
            socialMediaProfiles,
            contactPersonName,
            contactPersonPosition,
            contactEmail,
            contactPhone,
            status: "draft",
            emailVerified: false,
            phoneVerified: false,
            createdAt: now,
            updatedAt: now,
        };

        await organisationsCollection.doc(orgId).set(organisationData);

        // Send verification email
        try {
            await sendVerificationEmail(contactEmail, emailVerificationCode);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
        }

        res.json({
            success: true,
            data: {
                organisationId: orgId,
                message: "Registration step 1 completed. Please verify your email and phone.",
            },
        });
        return;
    } catch (error: any) {
        console.error("Registration step 1 error:", error);
        res.status(500).json({
            success: false,
            error: "Registration failed",
        });
        return;
    }
});

// POST /auth/register/step-2
router.post("/register/step-2", async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { error, value } = registerStep2Schema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }

        const { organisationId } = req.query;
        if (!organisationId || typeof organisationId !== "string") {
            res.status(400).json({
                success: false,
                error: "Organisation ID required",
            });
            return;
        }

        const profileData: RegisterStep2Request = value;

        // Get existing organisation
        const orgDoc = await organisationsCollection.doc(organisationId as string).get();
        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }

        const orgData = orgDoc.data() as Organisation;

        // Check if email and phone are verified
        if (!orgData.emailVerified || !orgData.phoneVerified) {
            res.status(400).json({
                success: false,
                error: "Email and phone must be verified before completing registration",
            });
            return;
        }

        // Update organisation with profile data
        const updateData = {
            ...profileData,
            status: "pending" as const,
            updatedAt: new Date(),
        };

        await organisationsCollection.doc(organisationId).update(updateData);

        res.json({
            success: true,
            data: {
                message: "Registration completed. Your profile is pending admin review.",
            },
        });
        return;
    } catch (error: any) {
        console.error("Registration step 2 error:", error);
        res.status(500).json({
            success: false,
            error: "Registration failed",
        });
        return;
    }
});

// POST /auth/admin/login - MUST be before /me route to avoid matching issues
router.post("/admin/login", async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    console.log('[DEBUG] /auth/admin/login - Request received');
    try {
        console.log('[DEBUG] /auth/admin/login - Request body:', { email: req.body?.email, hasPassword: !!req.body?.password });
        
        const { error, value } = superAdminLoginSchema.validate(req.body);
        if (error) {
            console.log('[DEBUG] /auth/admin/login - Validation error:', error.details[0].message);
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }

        const { email, password }: SuperAdminLoginRequest = value;
        console.log('[DEBUG] /auth/admin/login - Looking for admin with email:', email);

        // Get super admin data by email
        const adminQuery = await superAdminUsersCollection
            .where("email", "==", email)
            .limit(1)
            .get();

        if (adminQuery.empty) {
            console.log('[DEBUG] /auth/admin/login - Super admin not found for email:', email);
            res.status(404).json({
                success: false,
                error: "Super admin not found",
            });
            return;
        }

        const adminDoc = adminQuery.docs[0];
        const adminData = adminDoc.data() as AdminUser;
        console.log('[DEBUG] /auth/admin/login - Admin found:', { 
            id: adminDoc.id, 
            email: adminData.email,
            hasPasswordHash: !!adminData.passwordHash 
        });

        // Verify password
        if (!adminData.passwordHash) {
            console.log('[DEBUG] /auth/admin/login - No password hash found for admin:', adminDoc.id);
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }

        console.log('[DEBUG] /auth/admin/login - Comparing password...');
        const isPasswordValid = await bcrypt.compare(password, adminData.passwordHash);
        console.log('[DEBUG] /auth/admin/login - Password comparison result:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('[DEBUG] /auth/admin/login - Password mismatch for admin:', adminDoc.id);
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }

        // Update login tracking
        const now = new Date();
        await superAdminUsersCollection.doc(adminDoc.id).update({
            lastLoginAt: now,
            loginCount: (adminData.loginCount || 0) + 1,
        });

        // Generate JWT token
        const token = jwt.sign(
            {
                uid: adminData.firebaseUid || adminDoc.id,
                email: email,
                role: "super_admin",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: adminData.firebaseUid || adminDoc.id,
                    email: email,
                    role: "super_admin",
                },
                admin: {
                    id: adminDoc.id,
                    name: adminData.name,
                    email: adminData.email,
                    role: adminData.role,
                },
            },
        });
        return;
    } catch (error: any) {
        console.error("[ERROR] /auth/admin/login - Super admin login error:", error);
        console.error("[ERROR] /auth/admin/login - Error stack:", error?.stack);
        console.error("[ERROR] /auth/admin/login - Error details:", {
            message: error?.message,
            name: error?.name,
            code: error?.code
        });
        res.status(500).json({
            success: false,
            error: process.env.NODE_ENV === "production" ? "Login failed" : error?.message || "Login failed",
        });
        return;
    }
});

// GET /auth/me
router.get("/me", authenticateToken, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Authentication required",
            });
            return;
        }

        if (req.user.role === "organisation" && req.user.organisationId) {
            const orgDoc = await organisationsCollection.doc(req.user.organisationId as string).get();

            if (!orgDoc.exists) {
                res.status(404).json({
                    success: false,
                    error: "Organisation not found",
                });
                return;
            }

            const orgData = orgDoc.data();

            res.json({
                success: true,
                data: {
                    user: req.user,
                    organisation: groupOrganisationData(orgData, orgDoc.id),
                },
            });
            return;
        } else if (req.user.role === "super_admin") {
            // Get super admin data
            const adminQuery = await superAdminUsersCollection
                .where("firebaseUid", "==", req.user.id)
                .limit(1)
                .get();

            if (!adminQuery.empty) {
                const adminDoc = adminQuery.docs[0];
                const adminData = adminDoc.data() as AdminUser;

                res.json({
                    success: true,
                    data: {
                        user: req.user,
                        admin: {
                            id: adminDoc.id,
                            name: adminData.name,
                            email: adminData.email,
                            role: adminData.role,
                        },
                    },
                });
                return;
            }
        }

        res.json({
            success: true,
            data: {
                user: req.user,
            },
        });
        return;
    } catch (error: any) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get user data",
        });
        return;
    }
});

export default router; 