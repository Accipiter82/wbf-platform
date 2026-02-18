"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const multer_1 = __importDefault(require("multer"));
const mongodb_wrapper_1 = require("../services/mongodb-wrapper");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
const suspendOrganisationSchema = joi_1.default.object({
    reason: joi_1.default.string().min(10).max(500).required(),
});
const paginationSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(20),
    searchTerm: joi_1.default.string().optional().allow(''),
});
const createAdminUserSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    role: joi_1.default.string().valid("admin", "super_admin").default("super_admin"),
});
router.get("/organisations", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { error, value } = paginationSchema.validate(req.query);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }
        const { page, limit } = value;
        const searchTerm = req.query.searchTerm;
        const offset = (page - 1) * limit;
        const allSnapshot = await mongodb_wrapper_1.organisationsCollection
            .orderBy("createdAt", "desc")
            .get();
        let organisations = [];
        allSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            organisations.push({
                ...data,
                id: doc.id,
            });
        });
        if (searchTerm && searchTerm.trim().length >= 3) {
            const search = searchTerm.toLowerCase().trim();
            organisations = organisations.filter((org) => {
                const name = (org.name || "").toLowerCase();
                const nameLocal = (org.nameLocal || "").toLowerCase();
                return name.includes(search) || nameLocal.includes(search);
            });
        }
        const total = organisations.length;
        const totalPages = Math.ceil(total / limit);
        const paginatedOrganisations = organisations.slice(offset, offset + limit);
        res.json({
            success: true,
            data: {
                organisations: paginatedOrganisations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
        });
        return;
    }
    catch (error) {
        console.error("Get organisations error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get organisations",
        });
        return;
    }
});
router.get("/organisations/:id", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(id).get();
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
                ...orgData,
                id: orgDoc.id,
            },
        });
        return;
    }
    catch (error) {
        console.error("Get organisation error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get organisation",
        });
        return;
    }
});
router.post("/organisations/:id/suspend", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = suspendOrganisationSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }
        const { reason } = value;
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(id).get();
        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }
        const orgData = orgDoc.data();
        if (orgData.status === "suspended") {
            res.status(400).json({
                success: false,
                error: "Organisation is already suspended",
            });
            return;
        }
        const now = new Date();
        await mongodb_wrapper_1.organisationsCollection.doc(id).update({
            status: "suspended",
            suspendedAt: now,
            suspensionReason: reason,
            suspendedByAdminId: req.user.id,
            updatedAt: now,
        });
        res.json({
            success: true,
            data: {
                message: "Organisation suspended successfully",
            },
        });
        return;
    }
    catch (error) {
        console.error("Suspend organisation error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to suspend organisation",
        });
        return;
    }
});
router.post("/organisations/:id/unsuspend", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(id).get();
        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }
        const orgData = orgDoc.data();
        if (orgData.status !== "suspended") {
            res.status(400).json({
                success: false,
                error: "Organisation is not suspended",
            });
            return;
        }
        const now = new Date();
        await mongodb_wrapper_1.organisationsCollection.doc(id).update({
            status: "approved",
            suspendedAt: null,
            suspensionReason: null,
            suspendedByAdminId: null,
            updatedAt: now,
        });
        res.json({
            success: true,
            data: {
                message: "Organisation unsuspended successfully",
            },
        });
        return;
    }
    catch (error) {
        console.error("Unsuspend organisation error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to unsuspend organisation",
        });
        return;
    }
});
router.get("/dashboard/stats", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const orgsSnapshot = await mongodb_wrapper_1.organisationsCollection.get();
        let totalOrgs = 0;
        let activeOrgs = 0;
        let suspendedOrgs = 0;
        let pendingOrgs = 0;
        let draftOrgs = 0;
        orgsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            totalOrgs++;
            switch (data.status) {
                case "approved":
                    activeOrgs++;
                    break;
                case "suspended":
                    suspendedOrgs++;
                    break;
                case "pending":
                    pendingOrgs++;
                    break;
                case "draft":
                    draftOrgs++;
                    break;
            }
        });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentLoginsSnapshot = await mongodb_wrapper_1.organisationsCollection
            .where("lastLoginAt", ">=", thirtyDaysAgo)
            .get();
        const recentLogins = recentLoginsSnapshot.size;
        res.json({
            success: true,
            data: {
                totalOrganisations: totalOrgs,
                activeOrganisations: activeOrgs,
                suspendedOrganisations: suspendedOrgs,
                pendingOrganisations: pendingOrgs,
                draftOrganisations: draftOrgs,
                recentLogins,
            },
        });
        return;
    }
    catch (error) {
        console.error("Get dashboard stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get dashboard statistics",
        });
        return;
    }
});
router.get("/admin-users", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const adminUsersSnapshot = await mongodb_wrapper_1.superAdminUsersCollection
            .orderBy("createdAt", "desc")
            .get();
        const adminUsers = [];
        adminUsersSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            adminUsers.push({
                ...data,
                id: doc.id,
            });
        });
        res.json({
            success: true,
            data: {
                adminUsers,
            },
        });
        return;
    }
    catch (error) {
        console.error("Get admin users error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get admin users",
        });
        return;
    }
});
router.post("/admin-users", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { error, value } = createAdminUserSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }
        const { name, email, password, role } = value;
        const existingAdminQuery = await mongodb_wrapper_1.superAdminUsersCollection
            .where("email", "==", email)
            .limit(1)
            .get();
        if (!existingAdminQuery.empty) {
            res.status(409).json({
                success: false,
                error: "Admin user with this email already exists",
            });
            return;
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const adminId = (0, uuid_1.v4)();
        const now = new Date();
        const adminData = {
            email: email,
            name: name,
            role: role,
            createdAt: now,
            passwordHash: hashedPassword,
            firebaseUid: adminId,
            loginCount: 0,
        };
        await mongodb_wrapper_1.superAdminUsersCollection.doc(adminId).set(adminData);
        res.json({
            success: true,
            data: {
                message: "Admin user created successfully",
                adminUser: {
                    id: adminId,
                    name: name,
                    email: email,
                    role: role,
                    createdAt: now,
                },
            },
        });
        return;
    }
    catch (error) {
        console.error("Create admin user error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create admin user",
        });
        return;
    }
});
router.delete("/admin-users/:id", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const adminDoc = await mongodb_wrapper_1.superAdminUsersCollection.doc(id).get();
        if (!adminDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Admin user not found",
            });
            return;
        }
        const adminData = adminDoc.data();
        const superAdminCount = await mongodb_wrapper_1.superAdminUsersCollection
            .where("role", "==", "super_admin")
            .get();
        if (adminData.role === "super_admin" && superAdminCount.size <= 1) {
            res.status(400).json({
                success: false,
                error: "Cannot delete the last super admin user",
            });
            return;
        }
        await mongodb_wrapper_1.superAdminUsersCollection.doc(id).delete();
        res.json({
            success: true,
            data: {
                message: "Admin user deleted successfully",
            },
        });
        return;
    }
    catch (error) {
        console.error("Delete admin user error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete admin user",
        });
        return;
    }
});
const createCallProjectSchema = joi_1.default.object({
    organisationId: joi_1.default.string().required(),
    type: joi_1.default.string().valid("call", "project").required(),
    title: joi_1.default.string().min(3).max(200).required(),
    description: joi_1.default.string().min(10).required(),
    budget: joi_1.default.object({
        min: joi_1.default.number().min(0).required(),
        max: joi_1.default.number().min(0).required(),
        currency: joi_1.default.string().required(),
    }).required(),
    deadline: joi_1.default.alternatives().try(joi_1.default.date(), joi_1.default.string().isoDate(), joi_1.default.object({
        _seconds: joi_1.default.number().required(),
        _nanoseconds: joi_1.default.number().optional(),
    })).required(),
    location: joi_1.default.string().required(),
    thematicAreas: joi_1.default.array().items(joi_1.default.string()).min(1).required(),
    requiredExpertise: joi_1.default.array().items(joi_1.default.string()).optional(),
    projectDuration: joi_1.default.string().optional(),
    maxPartners: joi_1.default.number().optional(),
    status: joi_1.default.string().valid("active", "closed", "draft").default("active"),
    visibility: joi_1.default.string().valid("public", "members").default("public"),
    thumbnailImageUrl: joi_1.default.string().uri().optional(),
    shortDescription: joi_1.default.string().optional(),
    callType: joi_1.default.string().optional(),
    eligibleRegions: joi_1.default.array().items(joi_1.default.string()).optional(),
    openingDate: joi_1.default.alternatives().try(joi_1.default.date(), joi_1.default.string().isoDate(), joi_1.default.object({
        _seconds: joi_1.default.number().required(),
        _nanoseconds: joi_1.default.number().optional(),
    })).optional(),
    evaluationPeriod: joi_1.default.string().optional(),
    expectedStartDate: joi_1.default.alternatives().try(joi_1.default.date(), joi_1.default.string().isoDate(), joi_1.default.object({
        _seconds: joi_1.default.number().required(),
        _nanoseconds: joi_1.default.number().optional(),
    })).optional(),
    eligibilityCriteria: joi_1.default.string().optional(),
    numberOfAwards: joi_1.default.number().optional(),
    applicationLink: joi_1.default.string().uri().optional(),
    requiredDocuments: joi_1.default.array().items(joi_1.default.string()).optional(),
    contact: joi_1.default.object({
        name: joi_1.default.string().optional(),
        email: joi_1.default.string().email().optional(),
        phone: joi_1.default.string().optional(),
    }).optional(),
    guidelinePdfUrl: joi_1.default.string().uri().optional(),
    faqLink: joi_1.default.string().uri().optional(),
    shortSummary: joi_1.default.string().optional(),
    category: joi_1.default.string().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    startDate: joi_1.default.alternatives().try(joi_1.default.date(), joi_1.default.string().isoDate(), joi_1.default.object({
        _seconds: joi_1.default.number().required(),
        _nanoseconds: joi_1.default.number().optional(),
    })).optional(),
    endDate: joi_1.default.alternatives().try(joi_1.default.date(), joi_1.default.string().isoDate(), joi_1.default.object({
        _seconds: joi_1.default.number().required(),
        _nanoseconds: joi_1.default.number().optional(),
    })).optional(),
    ongoing: joi_1.default.boolean().optional(),
    projectStatus: joi_1.default.string().valid("planned", "ongoing", "completed").optional(),
    leadOrganisationId: joi_1.default.string().optional(),
    leadOrganisationName: joi_1.default.string().optional(),
    partnerOrganisationNames: joi_1.default.array().items(joi_1.default.string()).optional(),
    fundingSource: joi_1.default.string().optional(),
    budgetVisibility: joi_1.default.string().valid("public", "private").optional(),
    outcomes: joi_1.default.string().optional(),
    documents: joi_1.default.array().items(joi_1.default.object({
        name: joi_1.default.string().required(),
        url: joi_1.default.string().uri().required(),
        type: joi_1.default.string().optional(),
    })).optional(),
    reportUrls: joi_1.default.array().items(joi_1.default.string().uri()).optional(),
    projectManager: joi_1.default.object({
        name: joi_1.default.string().optional(),
        email: joi_1.default.string().email().optional(),
        phone: joi_1.default.string().optional(),
    }).optional(),
    website: joi_1.default.string().uri().optional(),
});
function toFirestoreTimestamp(date) {
    if (!date)
        return null;
    if (date._seconds) {
        return mongodb_wrapper_1.Timestamp.fromMillis(date._seconds * 1000 + (date._nanoseconds || 0) / 1000000);
    }
    if (typeof date === 'string') {
        return mongodb_wrapper_1.Timestamp.fromDate(new Date(date));
    }
    if (date instanceof Date) {
        return mongodb_wrapper_1.Timestamp.fromDate(date);
    }
    return null;
}
router.get("/calls-projects", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { type, page = "1", limit = "20", sortBy = "deadline-asc", status, searchTerm, thematicAreas, locations, budgetMin, budgetMax, includeFinished = "false", organisationId } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const includeFinishedBool = includeFinished === "true";
        let orgsSnapshot;
        if (organisationId && typeof organisationId === 'string') {
            const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(organisationId).get();
            orgsSnapshot = orgDoc.exists ? { docs: [orgDoc] } : { docs: [] };
        }
        else {
            orgsSnapshot = await mongodb_wrapper_1.organisationsCollection.get();
        }
        let allOpportunities = [];
        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            if (!orgData)
                continue;
            const orgInfo = {
                id: orgDoc.id,
                name: orgData.name,
                logo: orgData.images?.logo || orgData.logo
            };
            const calls = (orgData.calls || []).map((call) => ({
                ...call,
                type: 'call',
                organisation: orgInfo,
                createdByOrganisationId: orgDoc.id,
                status: call.status || "active"
            }));
            const projects = (orgData.projects || []).map((project) => ({
                ...project,
                type: 'project',
                organisation: orgInfo,
                createdByOrganisationId: orgDoc.id,
                status: project.status || "active"
            }));
            allOpportunities = [...allOpportunities, ...calls, ...projects];
        }
        let filteredOpportunities = allOpportunities;
        if (type && (type === 'call' || type === 'project')) {
            filteredOpportunities = filteredOpportunities.filter(op => op.type === type);
        }
        if (status) {
            const statusArray = Array.isArray(status) ? status : [status];
            filteredOpportunities = filteredOpportunities.filter(op => {
                const opStatus = op.status || "active";
                return statusArray.includes(opStatus);
            });
        }
        if (searchTerm && typeof searchTerm === 'string') {
            const search = searchTerm.toLowerCase();
            filteredOpportunities = filteredOpportunities.filter(op => op.title?.toLowerCase().includes(search) ||
                op.description?.toLowerCase().includes(search) ||
                op.organisation?.name?.toLowerCase().includes(search));
        }
        if (thematicAreas) {
            const areasArray = Array.isArray(thematicAreas) ? thematicAreas : [thematicAreas];
            filteredOpportunities = filteredOpportunities.filter(op => op.thematicAreas && op.thematicAreas.some((area) => areasArray.includes(area)));
        }
        if (locations) {
            const locationsArray = Array.isArray(locations) ? locations : [locations];
            filteredOpportunities = filteredOpportunities.filter(op => op.location && locationsArray.some((loc) => typeof loc === 'string' && op.location.toLowerCase().includes(loc.toLowerCase())));
        }
        if (budgetMin) {
            const min = parseFloat(budgetMin);
            filteredOpportunities = filteredOpportunities.filter(op => op.budget && op.budget.max >= min);
        }
        if (budgetMax) {
            const max = parseFloat(budgetMax);
            filteredOpportunities = filteredOpportunities.filter(op => op.budget && op.budget.min <= max);
        }
        if (!includeFinishedBool) {
            const now = new Date();
            filteredOpportunities = filteredOpportunities.filter(op => {
                if (!op.deadline)
                    return true;
                let deadlineDate;
                if (op.deadline._seconds) {
                    deadlineDate = new Date(op.deadline._seconds * 1000);
                }
                else if (typeof op.deadline === 'string') {
                    deadlineDate = new Date(op.deadline);
                }
                else {
                    deadlineDate = op.deadline;
                }
                return deadlineDate >= now;
            });
        }
        filteredOpportunities.sort((a, b) => {
            let aValue, bValue;
            switch (sortBy) {
                case "deadline-asc":
                    aValue = a.deadline?._seconds ? new Date(a.deadline._seconds * 1000) : new Date(0);
                    bValue = b.deadline?._seconds ? new Date(b.deadline._seconds * 1000) : new Date(0);
                    return aValue.getTime() - bValue.getTime();
                case "deadline-desc":
                    aValue = a.deadline?._seconds ? new Date(a.deadline._seconds * 1000) : new Date(0);
                    bValue = b.deadline?._seconds ? new Date(b.deadline._seconds * 1000) : new Date(0);
                    return bValue.getTime() - aValue.getTime();
                case "title-asc":
                    return (a.title || "").localeCompare(b.title || "");
                case "title-desc":
                    return (b.title || "").localeCompare(a.title || "");
                case "created-desc":
                    aValue = a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(0);
                    bValue = b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(0);
                    return bValue.getTime() - aValue.getTime();
                case "created-asc":
                    aValue = a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(0);
                    bValue = b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(0);
                    return aValue.getTime() - bValue.getTime();
                case "budget-asc":
                    return (a.budget?.min || 0) - (b.budget?.min || 0);
                case "budget-desc":
                    return (b.budget?.max || 0) - (a.budget?.max || 0);
                default:
                    return 0;
            }
        });
        const total = filteredOpportunities.length;
        const totalPages = Math.ceil(total / limitNum);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedOpportunities = filteredOpportunities.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: {
                opportunities: paginatedOpportunities,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                },
            },
        });
        return;
    }
    catch (error) {
        console.error("Get calls-projects error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch calls and projects",
        });
        return;
    }
});
router.post("/calls-projects", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { error, value } = createCallProjectSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }
        const { organisationId, type, ...opportunityData } = value;
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(organisationId).get();
        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }
        const orgData = orgDoc.data();
        const orgInfo = {
            id: organisationId,
            name: orgData.name,
            logo: orgData.images?.logo || orgData.logo
        };
        const opportunityId = (0, uuid_1.v4)();
        const now = mongodb_wrapper_1.Timestamp.now();
        const opportunity = {
            id: opportunityId,
            type,
            title: opportunityData.title,
            description: opportunityData.description,
            organisation: orgInfo,
            budget: opportunityData.budget,
            deadline: toFirestoreTimestamp(opportunityData.deadline),
            location: opportunityData.location,
            thematicAreas: opportunityData.thematicAreas,
            requiredExpertise: opportunityData.requiredExpertise || [],
            projectDuration: opportunityData.projectDuration || null,
            maxPartners: opportunityData.maxPartners || null,
            status: opportunityData.status || "active",
            applicationsCount: 0,
            createdAt: now,
            updatedAt: now,
            createdByOrganisationId: organisationId,
            visibility: opportunityData.visibility || "public",
        };
        if (opportunityData.thumbnailImageUrl) {
            opportunity.thumbnailImageUrl = opportunityData.thumbnailImageUrl;
        }
        if (type === "call") {
            if (opportunityData.shortDescription)
                opportunity.shortDescription = opportunityData.shortDescription;
            if (opportunityData.callType)
                opportunity.callType = opportunityData.callType;
            if (opportunityData.eligibleRegions)
                opportunity.eligibleRegions = opportunityData.eligibleRegions;
            if (opportunityData.openingDate)
                opportunity.openingDate = toFirestoreTimestamp(opportunityData.openingDate);
            if (opportunityData.evaluationPeriod)
                opportunity.evaluationPeriod = opportunityData.evaluationPeriod;
            if (opportunityData.expectedStartDate)
                opportunity.expectedStartDate = toFirestoreTimestamp(opportunityData.expectedStartDate);
            if (opportunityData.eligibilityCriteria)
                opportunity.eligibilityCriteria = opportunityData.eligibilityCriteria;
            if (opportunityData.numberOfAwards)
                opportunity.numberOfAwards = opportunityData.numberOfAwards;
            if (opportunityData.applicationLink)
                opportunity.applicationLink = opportunityData.applicationLink;
            if (opportunityData.requiredDocuments)
                opportunity.requiredDocuments = opportunityData.requiredDocuments;
            if (opportunityData.contact)
                opportunity.contact = opportunityData.contact;
            if (opportunityData.guidelinePdfUrl)
                opportunity.guidelinePdfUrl = opportunityData.guidelinePdfUrl;
            if (opportunityData.faqLink)
                opportunity.faqLink = opportunityData.faqLink;
        }
        if (type === "project") {
            if (opportunityData.shortSummary)
                opportunity.shortSummary = opportunityData.shortSummary;
            if (opportunityData.category)
                opportunity.category = opportunityData.category;
            if (opportunityData.tags)
                opportunity.tags = opportunityData.tags;
            if (opportunityData.startDate)
                opportunity.startDate = toFirestoreTimestamp(opportunityData.startDate);
            if (opportunityData.endDate)
                opportunity.endDate = toFirestoreTimestamp(opportunityData.endDate);
            if (opportunityData.ongoing !== undefined)
                opportunity.ongoing = opportunityData.ongoing;
            if (opportunityData.projectStatus)
                opportunity.projectStatus = opportunityData.projectStatus;
            if (opportunityData.leadOrganisationId)
                opportunity.leadOrganisationId = opportunityData.leadOrganisationId;
            if (opportunityData.leadOrganisationName)
                opportunity.leadOrganisationName = opportunityData.leadOrganisationName;
            if (opportunityData.partnerOrganisationNames)
                opportunity.partnerOrganisationNames = opportunityData.partnerOrganisationNames;
            if (opportunityData.fundingSource)
                opportunity.fundingSource = opportunityData.fundingSource;
            if (opportunityData.budgetVisibility)
                opportunity.budgetVisibility = opportunityData.budgetVisibility;
            if (opportunityData.outcomes)
                opportunity.outcomes = opportunityData.outcomes;
            if (opportunityData.documents)
                opportunity.documents = opportunityData.documents;
            if (opportunityData.reportUrls)
                opportunity.reportUrls = opportunityData.reportUrls;
            if (opportunityData.projectManager)
                opportunity.projectManager = opportunityData.projectManager;
            if (opportunityData.website)
                opportunity.website = opportunityData.website;
        }
        const cleanOpportunity = {};
        Object.keys(opportunity).forEach((key) => {
            if (opportunity[key] !== null && opportunity[key] !== undefined) {
                cleanOpportunity[key] = opportunity[key];
            }
        });
        const fieldName = type === "call" ? "calls" : "projects";
        const currentArray = orgData[fieldName] || [];
        const updatedArray = [...currentArray, cleanOpportunity];
        await mongodb_wrapper_1.organisationsCollection.doc(organisationId).update({
            [fieldName]: updatedArray,
            updatedAt: new Date(),
        });
        res.json({
            success: true,
            data: {
                message: `${type === "call" ? "Call" : "Project"} created successfully`,
                opportunity: cleanOpportunity,
            },
        });
        return;
    }
    catch (error) {
        console.error("Create call/project error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create call/project",
        });
        return;
    }
});
router.patch("/calls-projects/:organisationId/:opportunityId/status", auth_1.authenticateToken, auth_1.requireSuperAdmin, async (req, res) => {
    try {
        const { organisationId, opportunityId } = req.params;
        const { status, type } = req.body;
        if (!status || !["active", "closed", "draft"].includes(status)) {
            res.status(400).json({
                success: false,
                error: "Invalid status. Must be 'active', 'closed', or 'draft'",
            });
            return;
        }
        if (!type || !["call", "project"].includes(type)) {
            res.status(400).json({
                success: false,
                error: "Invalid type. Must be 'call' or 'project'",
            });
            return;
        }
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(organisationId).get();
        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }
        const orgData = orgDoc.data();
        const fieldName = type === "call" ? "calls" : "projects";
        const opportunities = orgData[fieldName] || [];
        const opportunityIndex = opportunities.findIndex((op) => op.id === opportunityId);
        if (opportunityIndex === -1) {
            res.status(404).json({
                success: false,
                error: `${type === "call" ? "Call" : "Project"} not found`,
            });
            return;
        }
        const updatedOpportunities = [...opportunities];
        updatedOpportunities[opportunityIndex] = {
            ...updatedOpportunities[opportunityIndex],
            status: status,
            updatedAt: mongodb_wrapper_1.Timestamp.now(),
            ...(status === "closed" && !updatedOpportunities[opportunityIndex].closedAt ? {
                closedAt: mongodb_wrapper_1.Timestamp.now(),
                closedByAdminId: req.user.id,
            } : {}),
        };
        await mongodb_wrapper_1.organisationsCollection.doc(organisationId).update({
            [fieldName]: updatedOpportunities,
            updatedAt: new Date(),
        });
        res.json({
            success: true,
            data: {
                message: `${type === "call" ? "Call" : "Project"} status updated successfully`,
                opportunity: updatedOpportunities[opportunityIndex],
            },
        });
        return;
    }
    catch (error) {
        console.error("Update call/project status error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update call/project status",
        });
        return;
    }
});
router.post("/upload-call-project-image", auth_1.authenticateToken, auth_1.requireSuperAdmin, upload.single('image'), async (req, res) => {
    return res.status(503).json({
        success: false,
        error: "File upload service is temporarily unavailable (Firebase Storage removed)."
    });
});
exports.default = router;
//# sourceMappingURL=super-admin.js.map