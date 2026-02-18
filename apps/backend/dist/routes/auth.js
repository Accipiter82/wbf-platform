"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongodb_wrapper_1 = require("../services/mongodb-wrapper");
const auth_1 = require("../middleware/auth");
const email_1 = require("../utils/email");
const verificationStorage_1 = require("../utils/verificationStorage");
const organisation_1 = require("./organisation");
const router = (0, express_1.Router)();
const loginSchema = joi_1.default.object({
    contactEmail: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
});
const superAdminLoginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
});
const simpleRegistrationSchema = joi_1.default.object({
    organisationName: joi_1.default.string().min(2).max(100).required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    phone: joi_1.default.string().min(8).optional().allow(''),
});
const emailVerificationSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    code: joi_1.default.string().length(6).optional(),
});
const phoneVerificationSchema = joi_1.default.object({
    phone: joi_1.default.string().min(8).required(),
    code: joi_1.default.string().length(6).optional(),
});
const registerStep1Schema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).required(),
    nameLocal: joi_1.default.string().min(2).max(100).required(),
    contractingParty: joi_1.default.string().required(),
    city: joi_1.default.string().required(),
    postalAddress: joi_1.default.string().required(),
    type: joi_1.default.string().required(),
    yearOfEstablishment: joi_1.default.number().integer().min(1900).max(new Date().getFullYear()).required(),
    registrationNumber: joi_1.default.string().optional().allow(''),
    numberOfStaff: joi_1.default.number().integer().optional(),
    numberOfVolunteers: joi_1.default.number().integer().optional(),
    missionFields: joi_1.default.array().items(joi_1.default.string()).optional(),
    website: joi_1.default.string().uri().optional().allow(''),
    socialMediaProfiles: joi_1.default.array().items(joi_1.default.string().uri()).optional(),
    contactPersonName: joi_1.default.string().required(),
    contactPersonPosition: joi_1.default.string().optional().allow(''),
    contactEmail: joi_1.default.string().email().required(),
    contactPhone: joi_1.default.string().optional().allow(''),
});
const registerStep2Schema = joi_1.default.object({
    wbfCallsApplied: joi_1.default.array().items(joi_1.default.object({
        callNumber: joi_1.default.string().required(),
        year: joi_1.default.number().integer().required(),
    })).optional(),
    roleInPastApplications: joi_1.default.array().items(joi_1.default.string().valid('Lead', 'Partner')).optional(),
    projectTitles: joi_1.default.array().items(joi_1.default.string()).optional(),
    projectDescriptions: joi_1.default.array().items(joi_1.default.string()).optional(),
    projectThematicAreas: joi_1.default.array().items(joi_1.default.string()).optional(),
    geographicalCoverage: joi_1.default.array().items(joi_1.default.string()).optional(),
    lookingForPartnersInThematicAreas: joi_1.default.array().items(joi_1.default.string()).optional(),
    lookingForPartnersFromCPs: joi_1.default.array().items(joi_1.default.string()).optional(),
    preferredRole: joi_1.default.array().items(joi_1.default.string().valid('Lead', 'Partner', 'Either')).optional(),
    expertiseOffered: joi_1.default.array().items(joi_1.default.string()).optional(),
    expertiseSought: joi_1.default.array().items(joi_1.default.string()).optional(),
    keywords: joi_1.default.array().items(joi_1.default.string()).optional(),
    availableResources: joi_1.default.array().items(joi_1.default.string()).optional(),
    referenceProjects: joi_1.default.array().items(joi_1.default.string()).optional(),
    successStories: joi_1.default.array().items(joi_1.default.string()).optional(),
    logo: joi_1.default.string().optional(),
});
router.post("/send-email-verification", async (req, res) => {
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
        const existingOrgQuery = await mongodb_wrapper_1.organisationsCollection
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
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
        await mongodb_wrapper_1.emailVerificationsCollection.doc(email).set({
            code: verificationCode,
            createdAt: now,
            expiresAt: expiresAt,
            verified: false,
        });
        try {
            await (0, email_1.sendVerificationEmail)(email, verificationCode);
        }
        catch (emailError) {
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
    }
    catch (error) {
        console.error("Send email verification error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to send verification email",
        });
        return;
    }
});
router.post("/verify/email", async (req, res) => {
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
        const doc = await mongodb_wrapper_1.emailVerificationsCollection.doc(email).get();
        if (!doc.exists) {
            res.status(400).json({
                success: false,
                error: "No verification code found. Please request a new one.",
            });
            return;
        }
        const verificationData = doc.data();
        if (!verificationData || verificationData.code !== code) {
            res.status(400).json({
                success: false,
                error: "Invalid verification code",
            });
            return;
        }
        let expiresAt = verificationData?.expiresAt;
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
        await mongodb_wrapper_1.emailVerificationsCollection.doc(email).update({
            verified: true,
            verifiedAt: new Date(),
        });
        res.json({
            success: true,
            data: {
                message: "Email verified successfully",
            },
        });
        return;
    }
    catch (error) {
        console.error("Verify email error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to verify email",
        });
        return;
    }
});
router.post("/send-phone-verification", async (req, res) => {
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
        await verificationStorage_1.verificationStorage.setPhoneVerification(phone, verificationCode);
        console.log(`SMS verification code for ${phone}: ${verificationCode}`);
        res.json({
            success: true,
            data: {
                message: "Verification code sent to your phone",
            },
        });
        return;
    }
    catch (error) {
        console.error("Send phone verification error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to send verification SMS",
        });
        return;
    }
});
router.post("/verify/phone", async (req, res) => {
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
        const verificationData = await verificationStorage_1.verificationStorage.getPhoneVerification(phone);
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
        await verificationStorage_1.verificationStorage.updatePhoneVerification(phone, {
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
    }
    catch (error) {
        console.error("Verify phone error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to verify phone",
        });
        return;
    }
});
router.post("/register/simple", async (req, res) => {
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
        const emailVerificationDoc = await mongodb_wrapper_1.emailVerificationsCollection.doc(email).get();
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
        const existingOrg = await mongodb_wrapper_1.organisationsCollection
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
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const orgId = (0, uuid_1.v4)();
        const now = new Date();
        const organisationData = {
            name: organisationName,
            contactEmail: email,
            contactPhone: phone || "",
            status: "draft",
            emailVerified: true,
            phoneVerified: false,
            passwordHash: hashedPassword,
            firebaseUid: orgId,
            createdAt: now,
            updatedAt: now,
        };
        await mongodb_wrapper_1.organisationsCollection.doc(orgId).set(organisationData);
        const token = jsonwebtoken_1.default.sign({
            uid: orgId,
            email: email,
            organisationId: orgId,
            role: "organisation",
        }, process.env.JWT_SECRET, { expiresIn: "7d" });
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
    }
    catch (error) {
        console.error("Simple registration error:", error);
        res.status(500).json({
            success: false,
            error: "Registration failed",
        });
        return;
    }
});
router.post("/login", async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }
        const { contactEmail, password } = value;
        const orgQuery = await mongodb_wrapper_1.organisationsCollection
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
        const orgData = orgDoc.data();
        if (orgData.status === "suspended") {
            res.status(403).json({
                success: false,
                error: "Your account is suspended. Please contact support at contact@wbf.com",
            });
            return;
        }
        console.log('[DEBUG] /auth/login - Organisation data fields:', {
            hasLogo: !!orgData.logo,
            hasCover: !!orgData.cover,
            logo: orgData.logo,
            cover: orgData.cover,
            allFields: Object.keys(orgData)
        });
        if (!orgData.passwordHash) {
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password || '', orgData.passwordHash || '');
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }
        const now = new Date();
        await mongodb_wrapper_1.organisationsCollection.doc(orgDoc.id).update({
            lastLoginAt: now,
            loginCount: (orgData.loginCount || 0) + 1,
        });
        const token = jsonwebtoken_1.default.sign({
            uid: orgData.firebaseUid || orgDoc.id,
            email: contactEmail,
            organisationId: orgDoc.id,
            role: "organisation",
        }, process.env.JWT_SECRET, { expiresIn: "7d" });
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
                organisation: (0, organisation_1.groupOrganisationData)(orgData, orgDoc.id),
            },
        });
        return;
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(401).json({
            success: false,
            error: "Invalid credentials",
        });
        return;
    }
});
router.post("/register/step-1", async (req, res) => {
    try {
        const { error, value } = registerStep1Schema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }
        const { name, nameLocal, contractingParty, city, postalAddress, type, yearOfEstablishment, registrationNumber, numberOfStaff, numberOfVolunteers, missionFields, website, socialMediaProfiles, contactPersonName, contactPersonPosition, contactEmail, contactPhone } = value;
        const existingOrg = await mongodb_wrapper_1.organisationsCollection
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
        const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const orgId = (0, uuid_1.v4)();
        const now = new Date();
        const organisationData = {
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
        await mongodb_wrapper_1.organisationsCollection.doc(orgId).set(organisationData);
        try {
            await (0, email_1.sendVerificationEmail)(contactEmail, emailVerificationCode);
        }
        catch (emailError) {
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
    }
    catch (error) {
        console.error("Registration step 1 error:", error);
        res.status(500).json({
            success: false,
            error: "Registration failed",
        });
        return;
    }
});
router.post("/register/step-2", async (req, res) => {
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
        const profileData = value;
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(organisationId).get();
        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }
        const orgData = orgDoc.data();
        if (!orgData.emailVerified || !orgData.phoneVerified) {
            res.status(400).json({
                success: false,
                error: "Email and phone must be verified before completing registration",
            });
            return;
        }
        const updateData = {
            ...profileData,
            status: "pending",
            updatedAt: new Date(),
        };
        await mongodb_wrapper_1.organisationsCollection.doc(organisationId).update(updateData);
        res.json({
            success: true,
            data: {
                message: "Registration completed. Your profile is pending admin review.",
            },
        });
        return;
    }
    catch (error) {
        console.error("Registration step 2 error:", error);
        res.status(500).json({
            success: false,
            error: "Registration failed",
        });
        return;
    }
});
router.post("/admin/login", async (req, res) => {
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
        const { email, password } = value;
        console.log('[DEBUG] /auth/admin/login - Looking for admin with email:', email);
        const adminQuery = await mongodb_wrapper_1.superAdminUsersCollection
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
        const adminData = adminDoc.data();
        console.log('[DEBUG] /auth/admin/login - Admin found:', {
            id: adminDoc.id,
            email: adminData.email,
            hasPasswordHash: !!adminData.passwordHash
        });
        if (!adminData.passwordHash) {
            console.log('[DEBUG] /auth/admin/login - No password hash found for admin:', adminDoc.id);
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }
        console.log('[DEBUG] /auth/admin/login - Comparing password...');
        const isPasswordValid = await bcryptjs_1.default.compare(password, adminData.passwordHash);
        console.log('[DEBUG] /auth/admin/login - Password comparison result:', isPasswordValid);
        if (!isPasswordValid) {
            console.log('[DEBUG] /auth/admin/login - Password mismatch for admin:', adminDoc.id);
            res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
            return;
        }
        const now = new Date();
        await mongodb_wrapper_1.superAdminUsersCollection.doc(adminDoc.id).update({
            lastLoginAt: now,
            loginCount: (adminData.loginCount || 0) + 1,
        });
        const token = jsonwebtoken_1.default.sign({
            uid: adminData.firebaseUid || adminDoc.id,
            email: email,
            role: "super_admin",
        }, process.env.JWT_SECRET, { expiresIn: "7d" });
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
    }
    catch (error) {
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
router.get("/me", auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "Authentication required",
            });
            return;
        }
        if (req.user.role === "organisation" && req.user.organisationId) {
            const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(req.user.organisationId).get();
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
                    organisation: (0, organisation_1.groupOrganisationData)(orgData, orgDoc.id),
                },
            });
            return;
        }
        else if (req.user.role === "super_admin") {
            const adminQuery = await mongodb_wrapper_1.superAdminUsersCollection
                .where("firebaseUid", "==", req.user.id)
                .limit(1)
                .get();
            if (!adminQuery.empty) {
                const adminDoc = adminQuery.docs[0];
                const adminData = adminDoc.data();
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
    }
    catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get user data",
        });
        return;
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map