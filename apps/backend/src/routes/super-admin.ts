import { Router, Request, Response } from "express";
import Joi from "joi";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { organisationsCollection, superAdminUsersCollection, surveysCollection, FieldValue, Timestamp } from "../services/mongodb-wrapper";
import { authenticateToken, requireSuperAdmin } from "../middleware/auth";
import {
    ApiResponse,
    Organisation,
    OrganisationListResponse,
    SuspendOrganisationRequest,
    AdminUser,
    Survey
} from "../types";
import { uploadToS3 } from "../services/storage";

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

// Validation schemas
const suspendOrganisationSchema = Joi.object({
    reason: Joi.string().min(10).max(500).required(),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    searchTerm: Joi.string().optional().allow(''),
});

const createAdminUserSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("admin", "super_admin").default("super_admin"),
});

// GET /super-admin/organisations - List all organisations with pagination and search
router.get("/organisations", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse<OrganisationListResponse>>): Promise<Response | void> => {
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
        const searchTerm = req.query.searchTerm as string | undefined;
        const offset = (page - 1) * limit;

        // Get all organisations for filtering
        const allSnapshot = await organisationsCollection
            .orderBy("createdAt", "desc")
            .get();

        let organisations: (Organisation & { id: string })[] = [];
        allSnapshot.docs.forEach((doc: any) => {
            const data = doc.data() as Organisation;
            organisations.push({
                ...data,
                id: doc.id,
            });
        });

        // Apply search filter if provided
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

        // Apply pagination
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
    } catch (error: any) {
        console.error("Get organisations error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get organisations",
        });
        return;
    }
});

// GET /super-admin/organisations/:id - Get specific organisation details
router.get("/organisations/:id", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { id } = req.params;

        const orgDoc = await organisationsCollection.doc(id).get();

        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }

        const orgData = orgDoc.data() as Organisation;

        res.json({
            success: true,
            data: {
                ...orgData,
                id: orgDoc.id,
            },
        });
        return;
    } catch (error: any) {
        console.error("Get organisation error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get organisation",
        });
        return;
    }
});

// POST /super-admin/organisations/:id/suspend - Suspend an organisation
router.post("/organisations/:id/suspend", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
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

        const { reason }: SuspendOrganisationRequest = value;

        // Check if organisation exists
        const orgDoc = await organisationsCollection.doc(id).get();

        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }

        const orgData = orgDoc.data() as Organisation;

        // Check if already suspended
        if (orgData.status === "suspended") {
            res.status(400).json({
                success: false,
                error: "Organisation is already suspended",
            });
            return;
        }

        // Update organisation status
        const now = new Date();
        await organisationsCollection.doc(id).update({
            status: "suspended",
            suspendedAt: now,
            suspensionReason: reason,
            suspendedByAdminId: req.user!.id,
            updatedAt: now,
        });

        res.json({
            success: true,
            data: {
                message: "Organisation suspended successfully",
            },
        });
        return;
    } catch (error: any) {
        console.error("Suspend organisation error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to suspend organisation",
        });
        return;
    }
});

// POST /super-admin/organisations/:id/unsuspend - Unsuspend an organisation
router.post("/organisations/:id/unsuspend", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { id } = req.params;

        // Check if organisation exists
        const orgDoc = await organisationsCollection.doc(id).get();

        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }

        const orgData = orgDoc.data() as Organisation;

        // Check if suspended
        if (orgData.status !== "suspended") {
            res.status(400).json({
                success: false,
                error: "Organisation is not suspended",
            });
            return;
        }

        // Update organisation status back to approved
        const now = new Date();
        await organisationsCollection.doc(id).update({
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
    } catch (error: any) {
        console.error("Unsuspend organisation error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to unsuspend organisation",
        });
        return;
    }
});

// GET /super-admin/dashboard/stats - Get dashboard statistics
router.get("/dashboard/stats", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        // Get organisation counts by status
        const orgsSnapshot = await organisationsCollection.get();

        let totalOrgs = 0;
        let activeOrgs = 0;
        let suspendedOrgs = 0;
        let pendingOrgs = 0;
        let draftOrgs = 0;

        orgsSnapshot.docs.forEach((doc: any) => {
            const data = doc.data() as Organisation;
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

        // Get recent logins (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentLoginsSnapshot = await organisationsCollection
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
    } catch (error: any) {
        console.error("Get dashboard stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get dashboard statistics",
        });
        return;
    }
});

// GET /super-admin/admin-users - List all admin users
router.get("/admin-users", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        // Get all super admin users
        const adminUsersSnapshot = await superAdminUsersCollection
            .orderBy("createdAt", "desc")
            .get();

        const adminUsers: (AdminUser & { id: string })[] = [];
        adminUsersSnapshot.docs.forEach((doc: any) => {
            const data = doc.data() as AdminUser;
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
    } catch (error: any) {
        console.error("Get admin users error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get admin users",
        });
        return;
    }
});

// POST /super-admin/admin-users - Create new admin user
router.post("/admin-users", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
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

        // Check if admin user already exists
        const existingAdminQuery = await superAdminUsersCollection
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

        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create admin user record (no Firebase Auth needed)
        const adminId = uuidv4();
        const now = new Date();

        const adminData: Partial<AdminUser> = {
            email: email,
            name: name,
            role: role as "admin" | "super_admin",
            createdAt: now,
            passwordHash: hashedPassword,
            firebaseUid: adminId, // Use adminId as uid since we're not using Firebase Auth
            loginCount: 0,
        };

        await superAdminUsersCollection.doc(adminId).set(adminData);

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
    } catch (error: any) {
        console.error("Create admin user error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create admin user",
        });
        return;
    }
});

// DELETE /super-admin/admin-users/:id - Delete admin user
router.delete("/admin-users/:id", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { id } = req.params;

        // Check if admin user exists
        const adminDoc = await superAdminUsersCollection.doc(id).get();

        if (!adminDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Admin user not found",
            });
            return;
        }

        const adminData = adminDoc.data() as AdminUser;

        // Prevent deleting the last super admin
        const superAdminCount = await superAdminUsersCollection
            .where("role", "==", "super_admin")
            .get();

        if (adminData.role === "super_admin" && superAdminCount.size <= 1) {
            res.status(400).json({
                success: false,
                error: "Cannot delete the last super admin user",
            });
            return;
        }

        // Firebase Auth no longer needed - user is stored in MongoDB only

        // Delete admin user record
        await superAdminUsersCollection.doc(id).delete();

        res.json({
            success: true,
            data: {
                message: "Admin user deleted successfully",
            },
        });
        return;
    } catch (error: any) {
        console.error("Delete admin user error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete admin user",
        });
        return;
    }
});

// Validation schema for creating call/project
const createCallProjectSchema = Joi.object({
    organisationId: Joi.string().required(),
    type: Joi.string().valid("call", "project").required(),
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).required(),
    budget: Joi.object({
        min: Joi.number().min(0).required(),
        max: Joi.number().min(0).required(),
        currency: Joi.string().required(),
    }).required(),
    deadline: Joi.alternatives().try(
        Joi.date(),
        Joi.string().isoDate(),
        Joi.object({
            _seconds: Joi.number().required(),
            _nanoseconds: Joi.number().optional(),
        })
    ).required(),
    location: Joi.string().required(),
    thematicAreas: Joi.array().items(Joi.string()).min(1).required(),
    requiredExpertise: Joi.array().items(Joi.string()).optional(),
    projectDuration: Joi.string().optional(),
    maxPartners: Joi.number().optional(),
    status: Joi.string().valid("active", "closed", "draft").default("active"),
    visibility: Joi.string().valid("public", "members").default("public"),
    thumbnailImageUrl: Joi.string().uri().optional(),
    // Call-specific fields
    shortDescription: Joi.string().optional(),
    callType: Joi.string().optional(),
    eligibleRegions: Joi.array().items(Joi.string()).optional(),
    openingDate: Joi.alternatives().try(
        Joi.date(),
        Joi.string().isoDate(),
        Joi.object({
            _seconds: Joi.number().required(),
            _nanoseconds: Joi.number().optional(),
        })
    ).optional(),
    evaluationPeriod: Joi.string().optional(),
    expectedStartDate: Joi.alternatives().try(
        Joi.date(),
        Joi.string().isoDate(),
        Joi.object({
            _seconds: Joi.number().required(),
            _nanoseconds: Joi.number().optional(),
        })
    ).optional(),
    eligibilityCriteria: Joi.string().optional(),
    numberOfAwards: Joi.number().optional(),
    applicationLink: Joi.string().uri().optional(),
    requiredDocuments: Joi.array().items(Joi.string()).optional(),
    contact: Joi.object({
        name: Joi.string().optional(),
        email: Joi.string().email().optional(),
        phone: Joi.string().optional(),
    }).optional(),
    guidelinePdfUrl: Joi.string().uri().optional(),
    faqLink: Joi.string().uri().optional(),
    // Project-specific fields
    shortSummary: Joi.string().optional(),
    category: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    startDate: Joi.alternatives().try(
        Joi.date(),
        Joi.string().isoDate(),
        Joi.object({
            _seconds: Joi.number().required(),
            _nanoseconds: Joi.number().optional(),
        })
    ).optional(),
    endDate: Joi.alternatives().try(
        Joi.date(),
        Joi.string().isoDate(),
        Joi.object({
            _seconds: Joi.number().required(),
            _nanoseconds: Joi.number().optional(),
        })
    ).optional(),
    ongoing: Joi.boolean().optional(),
    projectStatus: Joi.string().valid("planned", "ongoing", "completed").optional(),
    leadOrganisationId: Joi.string().optional(),
    leadOrganisationName: Joi.string().optional(),
    partnerOrganisationNames: Joi.array().items(Joi.string()).optional(),
    fundingSource: Joi.string().optional(),
    budgetVisibility: Joi.string().valid("public", "private").optional(),
    outcomes: Joi.string().optional(),
    documents: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        url: Joi.string().uri().required(),
        type: Joi.string().optional(),
    })).optional(),
    reportUrls: Joi.array().items(Joi.string().uri()).optional(),
    projectManager: Joi.object({
        name: Joi.string().optional(),
        email: Joi.string().email().optional(),
        phone: Joi.string().optional(),
    }).optional(),
    website: Joi.string().uri().optional(),
});

// Helper function to convert date to Firestore Timestamp
function toFirestoreTimestamp(date: any): any {
    if (!date) return null;
    if (date._seconds) {
        return Timestamp.fromMillis(date._seconds * 1000 + (date._nanoseconds || 0) / 1000000);
    }
    if (typeof date === 'string') {
        return Timestamp.fromDate(new Date(date));
    }
    if (date instanceof Date) {
        return Timestamp.fromDate(date);
    }
    return null;
}

// GET /super-admin/calls-projects - Get all calls and projects from all organisations
router.get("/calls-projects", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const {
            type,
            page = "1",
            limit = "20",
            sortBy = "deadline-asc",
            status,
            searchTerm,
            thematicAreas,
            locations,
            budgetMin,
            budgetMax,
            includeFinished = "false",
            organisationId
        } = req.query;

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 20;
        const includeFinishedBool = includeFinished === "true";

        // Get organizations (filter by organisationId if provided)
        let orgsSnapshot;
        if (organisationId && typeof organisationId === 'string') {
            const orgDoc = await organisationsCollection.doc(organisationId).get();
            orgsSnapshot = orgDoc.exists ? { docs: [orgDoc] } : { docs: [] };
        } else {
            orgsSnapshot = await organisationsCollection.get();
        }
        let allOpportunities: any[] = [];

        // Collect opportunities from all organizations
        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            if (!orgData) continue;
            const orgInfo = {
                id: orgDoc.id,
                name: orgData.name,
                logo: orgData.images?.logo || orgData.logo
            };

            // Get calls and projects from this organization
            const calls = (orgData.calls || []).map((call: any) => ({
                ...call,
                type: 'call',
                organisation: orgInfo,
                createdByOrganisationId: orgDoc.id,
                // Ensure status is always set (default to "active" if missing)
                status: call.status || "active"
            }));

            const projects = (orgData.projects || []).map((project: any) => ({
                ...project,
                type: 'project',
                organisation: orgInfo,
                createdByOrganisationId: orgDoc.id,
                // Ensure status is always set (default to "active" if missing)
                status: project.status || "active"
            }));

            allOpportunities = [...allOpportunities, ...calls, ...projects];
        }

        // Apply filters
        let filteredOpportunities = allOpportunities;

        // Filter by type
        if (type && (type === 'call' || type === 'project')) {
            filteredOpportunities = filteredOpportunities.filter(op => op.type === type);
        }

        // Filter by status - ensure status field exists and matches filter
        if (status) {
            const statusArray = Array.isArray(status) ? status : [status];
            filteredOpportunities = filteredOpportunities.filter(op => {
                // Normalize status - default to "active" if missing
                const opStatus = op.status || "active";
                return statusArray.includes(opStatus);
            });
        }

        // Filter by search term
        if (searchTerm && typeof searchTerm === 'string') {
            const search = searchTerm.toLowerCase();
            filteredOpportunities = filteredOpportunities.filter(op =>
                op.title?.toLowerCase().includes(search) ||
                op.description?.toLowerCase().includes(search) ||
                op.organisation?.name?.toLowerCase().includes(search)
            );
        }

        // Filter by thematic areas
        if (thematicAreas) {
            const areasArray = Array.isArray(thematicAreas) ? thematicAreas : [thematicAreas];
            filteredOpportunities = filteredOpportunities.filter(op =>
                op.thematicAreas && op.thematicAreas.some((area: string) =>
                    areasArray.includes(area)
                )
            );
        }

        // Filter by locations
        if (locations) {
            const locationsArray = Array.isArray(locations) ? locations : [locations];
            filteredOpportunities = filteredOpportunities.filter(op =>
                op.location && locationsArray.some((loc) =>
                    typeof loc === 'string' && op.location.toLowerCase().includes(loc.toLowerCase())
                )
            );
        }

        // Filter by budget
        if (budgetMin) {
            const min = parseFloat(budgetMin as string);
            filteredOpportunities = filteredOpportunities.filter(op =>
                op.budget && op.budget.max >= min
            );
        }

        if (budgetMax) {
            const max = parseFloat(budgetMax as string);
            filteredOpportunities = filteredOpportunities.filter(op =>
                op.budget && op.budget.min <= max
            );
        }

        // Filter finished opportunities
        if (!includeFinishedBool) {
            const now = new Date();
            filteredOpportunities = filteredOpportunities.filter(op => {
                if (!op.deadline) return true;
                let deadlineDate: Date;
                if (op.deadline._seconds) {
                    deadlineDate = new Date(op.deadline._seconds * 1000);
                } else if (typeof op.deadline === 'string') {
                    deadlineDate = new Date(op.deadline);
                } else {
                    deadlineDate = op.deadline;
                }
                return deadlineDate >= now;
            });
        }

        // Sort opportunities
        filteredOpportunities.sort((a, b) => {
            let aValue: any, bValue: any;

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

        // Pagination
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
    } catch (error: any) {
        console.error("Get calls-projects error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch calls and projects",
        });
        return;
    }
});

// POST /super-admin/calls-projects - Create a call or project for a specific organisation
router.post("/calls-projects", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
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

        // Check if organisation exists
        const orgDoc = await organisationsCollection.doc(organisationId).get();
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
            name: orgData!.name,
            logo: orgData!.images?.logo || orgData!.logo
        };

        // Generate ID for the call/project
        const opportunityId = uuidv4();

        // Prepare the opportunity object
        const now = Timestamp.now();
        const opportunity: any = {
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

        // Add thumbnail image URL if provided
        if (opportunityData.thumbnailImageUrl) {
            opportunity.thumbnailImageUrl = opportunityData.thumbnailImageUrl;
        }

        // Add call-specific fields
        if (type === "call") {
            if (opportunityData.shortDescription) opportunity.shortDescription = opportunityData.shortDescription;
            if (opportunityData.callType) opportunity.callType = opportunityData.callType;
            if (opportunityData.eligibleRegions) opportunity.eligibleRegions = opportunityData.eligibleRegions;
            if (opportunityData.openingDate) opportunity.openingDate = toFirestoreTimestamp(opportunityData.openingDate);
            if (opportunityData.evaluationPeriod) opportunity.evaluationPeriod = opportunityData.evaluationPeriod;
            if (opportunityData.expectedStartDate) opportunity.expectedStartDate = toFirestoreTimestamp(opportunityData.expectedStartDate);
            if (opportunityData.eligibilityCriteria) opportunity.eligibilityCriteria = opportunityData.eligibilityCriteria;
            if (opportunityData.numberOfAwards) opportunity.numberOfAwards = opportunityData.numberOfAwards;
            if (opportunityData.applicationLink) opportunity.applicationLink = opportunityData.applicationLink;
            if (opportunityData.requiredDocuments) opportunity.requiredDocuments = opportunityData.requiredDocuments;
            if (opportunityData.contact) opportunity.contact = opportunityData.contact;
            if (opportunityData.guidelinePdfUrl) opportunity.guidelinePdfUrl = opportunityData.guidelinePdfUrl;
            if (opportunityData.faqLink) opportunity.faqLink = opportunityData.faqLink;
        }

        // Add project-specific fields
        if (type === "project") {
            if (opportunityData.shortSummary) opportunity.shortSummary = opportunityData.shortSummary;
            if (opportunityData.category) opportunity.category = opportunityData.category;
            if (opportunityData.tags) opportunity.tags = opportunityData.tags;
            if (opportunityData.startDate) opportunity.startDate = toFirestoreTimestamp(opportunityData.startDate);
            if (opportunityData.endDate) opportunity.endDate = toFirestoreTimestamp(opportunityData.endDate);
            if (opportunityData.ongoing !== undefined) opportunity.ongoing = opportunityData.ongoing;
            if (opportunityData.projectStatus) opportunity.projectStatus = opportunityData.projectStatus;
            if (opportunityData.leadOrganisationId) opportunity.leadOrganisationId = opportunityData.leadOrganisationId;
            if (opportunityData.leadOrganisationName) opportunity.leadOrganisationName = opportunityData.leadOrganisationName;
            if (opportunityData.partnerOrganisationNames) opportunity.partnerOrganisationNames = opportunityData.partnerOrganisationNames;
            if (opportunityData.fundingSource) opportunity.fundingSource = opportunityData.fundingSource;
            if (opportunityData.budgetVisibility) opportunity.budgetVisibility = opportunityData.budgetVisibility;
            if (opportunityData.outcomes) opportunity.outcomes = opportunityData.outcomes;
            if (opportunityData.documents) opportunity.documents = opportunityData.documents;
            if (opportunityData.reportUrls) opportunity.reportUrls = opportunityData.reportUrls;
            if (opportunityData.projectManager) opportunity.projectManager = opportunityData.projectManager;
            if (opportunityData.website) opportunity.website = opportunityData.website;
        }

        // Remove null/undefined values
        const cleanOpportunity: any = {};
        Object.keys(opportunity).forEach((key) => {
            if (opportunity[key] !== null && opportunity[key] !== undefined) {
                cleanOpportunity[key] = opportunity[key];
            }
        });

        // Add to organisation's calls or projects array
        const fieldName = type === "call" ? "calls" : "projects";
        const currentArray = orgData![fieldName] || [];
        const updatedArray = [...currentArray, cleanOpportunity];

        // Update organisation document
        await organisationsCollection.doc(organisationId).update({
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
    } catch (error: any) {
        console.error("Create call/project error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create call/project",
        });
        return;
    }
});

// PATCH /super-admin/calls-projects/:organisationId/:opportunityId/status - Update call/project status
router.patch("/calls-projects/:organisationId/:opportunityId/status", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { organisationId, opportunityId } = req.params;
        const { status, type } = req.body;

        // Validate status
        if (!status || !["active", "closed", "draft"].includes(status)) {
            res.status(400).json({
                success: false,
                error: "Invalid status. Must be 'active', 'closed', or 'draft'",
            });
            return;
        }

        // Validate type
        if (!type || !["call", "project"].includes(type)) {
            res.status(400).json({
                success: false,
                error: "Invalid type. Must be 'call' or 'project'",
            });
            return;
        }

        // Check if organisation exists
        const orgDoc = await organisationsCollection.doc(organisationId).get();
        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }

        const orgData = orgDoc.data();
        const fieldName = type === "call" ? "calls" : "projects";
        const opportunities = orgData![fieldName] || [];

        // Find the opportunity to update
        const opportunityIndex = opportunities.findIndex((op: any) => op.id === opportunityId);
        
        if (opportunityIndex === -1) {
            res.status(404).json({
                success: false,
                error: `${type === "call" ? "Call" : "Project"} not found`,
            });
            return;
        }

        // Update the opportunity status
        const updatedOpportunities = [...opportunities];
        updatedOpportunities[opportunityIndex] = {
            ...updatedOpportunities[opportunityIndex],
            status: status,
            updatedAt: Timestamp.now(),
            // If closing, also update the deadline to now (optional - you can remove this if not needed)
            ...(status === "closed" && !updatedOpportunities[opportunityIndex].closedAt ? {
                closedAt: Timestamp.now(),
                closedByAdminId: req.user!.id,
            } : {}),
        };

        // Update organisation document
        await organisationsCollection.doc(organisationId).update({
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
    } catch (error: any) {
        console.error("Update call/project status error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update call/project status",
        });
        return;
    }
});

// POST /super-admin/upload-call-project-image - Upload thumbnail image for call/project
// @ts-ignore
router.post("/upload-call-project-image", authenticateToken, requireSuperAdmin, upload.single('image'), async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Image file is required",
            });
        }

        const organisationId = req.body.organisationId;
        if (!organisationId) {
            return res.status(400).json({
                success: false,
                error: "organisationId is required",
            });
        }

        const organisationDoc = await organisationsCollection.doc(organisationId).get();
        if (!organisationDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const { url, key } = await uploadToS3({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            folder: `organisations/${organisationId}/calls-projects`,
        });

        return res.json({
            success: true,
            data: {
                url,
                path: key,
            },
        });
    } catch (error) {
        console.error("Upload call/project image error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to upload image",
        });
    }
});

// ==================== SURVEY MANAGEMENT ====================

const createSurveySchema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).allow("").optional(),
    url: Joi.string().uri().required(),
    status: Joi.string().valid("active", "inactive").default("active"),
});

const updateSurveySchema = Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(1000).allow("").optional(),
    url: Joi.string().uri().optional(),
    status: Joi.string().valid("active", "inactive").optional(),
});

// GET /super-admin/surveys - List all surveys
router.get("/surveys", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const surveysSnapshot = await surveysCollection
            .orderBy("createdAt", "desc")
            .get();

        const surveys: (Survey & { id: string })[] = [];
        surveysSnapshot.docs.forEach((doc: any) => {
            const data = doc.data() as Survey;
            surveys.push({ ...data, id: doc.id });
        });

        res.json({ success: true, data: { surveys } });
        return;
    } catch (error: any) {
        console.error("Get surveys error:", error);
        res.status(500).json({ success: false, error: "Failed to get surveys" });
        return;
    }
});

// POST /super-admin/surveys - Create a new survey
router.post("/surveys", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { error, value } = createSurveySchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, error: error.details[0].message });
            return;
        }

        const surveyId = uuidv4();
        const now = new Date();

        const surveyData: Partial<Survey> = {
            title: value.title,
            description: value.description || "",
            url: value.url,
            status: value.status,
            createdAt: now,
            updatedAt: now,
            createdByAdminId: req.user!.id,
        };

        await surveysCollection.doc(surveyId).set(surveyData);

        res.json({
            success: true,
            data: { message: "Survey created successfully", survey: { ...surveyData, id: surveyId } },
        });
        return;
    } catch (error: any) {
        console.error("Create survey error:", error);
        res.status(500).json({ success: false, error: "Failed to create survey" });
        return;
    }
});

// PATCH /super-admin/surveys/:id - Update a survey
router.patch("/surveys/:id", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { id } = req.params;
        const { error, value } = updateSurveySchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, error: error.details[0].message });
            return;
        }

        const surveyDoc = await surveysCollection.doc(id).get();
        if (!surveyDoc.exists) {
            res.status(404).json({ success: false, error: "Survey not found" });
            return;
        }

        const updateData = { ...value, updatedAt: new Date() };
        await surveysCollection.doc(id).update(updateData);

        res.json({
            success: true,
            data: { message: "Survey updated successfully" },
        });
        return;
    } catch (error: any) {
        console.error("Update survey error:", error);
        res.status(500).json({ success: false, error: "Failed to update survey" });
        return;
    }
});

// DELETE /super-admin/surveys/:id - Delete a survey
router.delete("/surveys/:id", authenticateToken, requireSuperAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
    try {
        const { id } = req.params;

        const surveyDoc = await surveysCollection.doc(id).get();
        if (!surveyDoc.exists) {
            res.status(404).json({ success: false, error: "Survey not found" });
            return;
        }

        await surveysCollection.doc(id).delete();

        res.json({
            success: true,
            data: { message: "Survey deleted successfully" },
        });
        return;
    } catch (error: any) {
        console.error("Delete survey error:", error);
        res.status(500).json({ success: false, error: "Failed to delete survey" });
        return;
    }
});

export default router;
