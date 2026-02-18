"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupOrganisationData = groupOrganisationData;
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const mongodb_wrapper_1 = require("../services/mongodb-wrapper");
const mongodb_wrapper_2 = require("../services/mongodb-wrapper");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
const resolveOrganisationDocument = async (req) => {
    if (!req.user) {
        console.log('[DEBUG] resolveOrganisationDocument - No user in request');
        return null;
    }
    console.log('[DEBUG] resolveOrganisationDocument - Starting lookup', {
        organisationId: req.user.organisationId,
        email: req.user.email,
        role: req.user.role
    });
    const fetchById = async (id) => {
        if (!id) {
            return null;
        }
        const doc = await mongodb_wrapper_1.organisationsCollection.doc(id).get();
        console.log('[DEBUG] resolveOrganisationDocument - Fetched by ID', {
            id,
            exists: doc.exists
        });
        return doc.exists ? doc : null;
    };
    let organisationDoc = await fetchById(req.user.organisationId);
    if (organisationDoc) {
        console.log('[DEBUG] resolveOrganisationDocument - Found by ID');
        return organisationDoc;
    }
    const emailCandidates = new Set();
    if (req.user.email) {
        emailCandidates.add(req.user.email);
        emailCandidates.add(req.user.email.trim());
        emailCandidates.add(req.user.email.toLowerCase());
        emailCandidates.add(req.user.email.trim().toLowerCase());
    }
    console.log('[DEBUG] resolveOrganisationDocument - Trying email lookup', {
        emailCandidates: Array.from(emailCandidates)
    });
    for (const email of emailCandidates) {
        if (!email)
            continue;
        let query = await mongodb_wrapper_1.organisationsCollection
            .where("contactEmail", "==", email)
            .limit(1)
            .get();
        console.log('[DEBUG] resolveOrganisationDocument - contactEmail query', {
            email,
            found: !query.empty
        });
        if (query.empty) {
            query = await mongodb_wrapper_1.organisationsCollection
                .where("contact.email", "==", email)
                .limit(1)
                .get();
            console.log('[DEBUG] resolveOrganisationDocument - contact.email query', {
                email,
                found: !query.empty
            });
        }
        if (!query.empty) {
            organisationDoc = query.docs[0];
            if (organisationDoc) {
                req.user.organisationId = organisationDoc.id;
                console.log('[DEBUG] resolveOrganisationDocument - Found by email', {
                    email,
                    organisationId: organisationDoc.id
                });
                return organisationDoc;
            }
        }
    }
    console.log('[DEBUG] resolveOrganisationDocument - Organisation not found');
    return null;
};
router.post("/upload-logo", auth_1.authenticateToken, auth_1.requireOrganisationForProfile, upload.single('logo'), async (req, res, next) => {
    return res.status(503).json({
        success: false,
        error: "File upload service is temporarily unavailable (Firebase Storage removed). Please implement a new storage provider."
    });
});
router.post("/upload-cover", auth_1.authenticateToken, auth_1.requireOrganisationForProfile, upload.single('cover'), async (req, res, next) => {
    return res.status(503).json({
        success: false,
        error: "File upload service is temporarily unavailable (Firebase Storage removed). Please implement a new storage provider."
    });
});
router.post("/delete-cover", auth_1.authenticateToken, auth_1.requireOrganisationForProfile, async (req, res, next) => {
    return res.status(503).json({
        success: false,
        error: "File storage service is temporarily unavailable (Firebase Storage removed)."
    });
});
router.post("/delete-logo", auth_1.authenticateToken, auth_1.requireOrganisationForProfile, async (req, res, next) => {
    return res.status(503).json({
        success: false,
        error: "File storage service is temporarily unavailable (Firebase Storage removed)."
    });
});
router.post("/upload-project-image", auth_1.authenticateToken, auth_1.requireOrganisationForProfile, upload.single('image'), async (req, res, next) => {
    return res.status(503).json({
        success: false,
        error: "File upload service is temporarily unavailable (Firebase Storage removed)."
    });
});
router.post("/delete-project-image", auth_1.authenticateToken, auth_1.requireOrganisationForProfile, async (req, res, next) => {
    return res.status(503).json({
        success: false,
        error: "File storage service is temporarily unavailable (Firebase Storage removed)."
    });
});
router.post("/upload-success-story-image", auth_1.authenticateToken, auth_1.requireOrganisationForProfile, upload.single('image'), async (req, res, next) => {
    return res.status(503).json({
        success: false,
        error: "File upload service is temporarily unavailable (Firebase Storage removed)."
    });
});
router.post("/delete-success-story-image", auth_1.authenticateToken, auth_1.requireOrganisationForProfile, async (req, res, next) => {
    return res.status(503).json({
        success: false,
        error: "File storage service is temporarily unavailable (Firebase Storage removed)."
    });
});
const updateOrganisationSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).optional(),
    nameLocal: joi_1.default.string().min(2).max(100).optional(),
    contractingParty: joi_1.default.string().optional(),
    city: joi_1.default.string().optional(),
    postalAddress: joi_1.default.string().optional(),
    type: joi_1.default.string().optional(),
    yearOfEstablishment: joi_1.default.alternatives().try(joi_1.default.number().integer().min(1900).max(new Date().getFullYear()), joi_1.default.string().pattern(/^\d{4}$/)).optional(),
    registrationNumber: joi_1.default.string().optional().allow(null, ''),
    numberOfStaff: joi_1.default.alternatives().try(joi_1.default.number().integer().min(0), joi_1.default.string().pattern(/^\d+$|^\d+-\d+$/)).optional(),
    numberOfVolunteers: joi_1.default.alternatives().try(joi_1.default.number().integer().min(0), joi_1.default.string().pattern(/^\d+$|^\d+-\d+$/)).optional(),
    missionFields: joi_1.default.array().items(joi_1.default.string()).optional(),
    website: joi_1.default.string().uri().optional().allow(null, ''),
    socialMediaProfiles: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    contactPersonName: joi_1.default.string().optional(),
    contactPersonPosition: joi_1.default.string().optional().allow(null, ''),
    contactEmail: joi_1.default.string().email().optional(),
    contactPhone: joi_1.default.string().optional().allow(null, ''),
    wbfCallsApplied: joi_1.default.array().items(joi_1.default.object({
        callNumber: joi_1.default.string().required(),
        year: joi_1.default.alternatives().try(joi_1.default.number().integer(), joi_1.default.string().pattern(/^\d{4}$/)).required(),
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
const completeProfileSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).optional(),
    nameLocal: joi_1.default.string().min(2).max(100).required(),
    contractingParty: joi_1.default.string().min(2).max(100).required(),
    city: joi_1.default.string().min(2).max(100).required(),
    postalAddress: joi_1.default.string().optional().allow(null, ''),
    type: joi_1.default.string().required(),
    yearOfEstablishment: joi_1.default.alternatives().try(joi_1.default.number().integer().min(1900).max(new Date().getFullYear()), joi_1.default.string().pattern(/^\d{4}$/)).required(),
    registrationNumber: joi_1.default.string().optional().allow(null, ''),
    logoUrl: joi_1.default.alternatives().try(joi_1.default.string().uri(), joi_1.default.string().allow('', null)).optional(),
    coverUrl: joi_1.default.alternatives().try(joi_1.default.string().uri(), joi_1.default.string().allow('', null)).optional(),
    numberOfStaff: joi_1.default.alternatives().try(joi_1.default.number().integer().min(0), joi_1.default.string().pattern(/^\d+$|^\d+-\d+$/)).optional().allow(null, ''),
    numberOfVolunteers: joi_1.default.alternatives().try(joi_1.default.number().integer().min(0), joi_1.default.string().pattern(/^\d+-\d+$|^\d+$/)).optional().allow(null, ''),
    missionFields: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    website: joi_1.default.string().uri().optional().allow(null, ''),
    socialMediaProfiles: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    contactPersonName: joi_1.default.string().min(2).max(100).required(),
    contactPersonPosition: joi_1.default.string().optional().allow(null, ''),
    contactEmail: joi_1.default.string().email().required(),
    contactPhone: joi_1.default.string().optional().allow(null, ''),
    wbfCallsApplied: joi_1.default.array().items(joi_1.default.object({
        callNumber: joi_1.default.string().required(),
        year: joi_1.default.alternatives().try(joi_1.default.number().integer(), joi_1.default.string().pattern(/^\d{4}$/)).required(),
    })).optional().allow(null),
    roleInPastApplications: joi_1.default.array().items(joi_1.default.string().valid('Lead', 'Partner')).optional().allow(null),
    projects: joi_1.default.array().items(joi_1.default.object({
        title: joi_1.default.string().optional(),
        description: joi_1.default.string().optional(),
        imageUrl: joi_1.default.string().optional(),
        imagePath: joi_1.default.string().optional(),
    })).optional().allow(null),
    projectTitles: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    projectDescriptions: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    projectThematicAreas: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    geographicalCoverage: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    lookingForPartnersInThematicAreas: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    lookingForPartnersFromCPs: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    preferredRole: joi_1.default.array().items(joi_1.default.string().valid('Lead', 'Partner', 'Either')).optional().allow(null),
    expertiseOffered: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    expertiseSought: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    keywords: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    availableResources: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    referenceProjects: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    successStories: joi_1.default.array().items(joi_1.default.string()).optional().allow(null),
    partnershipNotes: joi_1.default.string().optional().allow(null, ''),
});
function groupOrganisationData(org, id) {
    return {
        id,
        name: org.name,
        nameLocal: org.nameLocal,
        type: org.type,
        status: org.status,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        images: {
            cover: org.coverImage || org.cover || org.coverUrl || "",
            logo: org.logo || org.logoUrl || "",
        },
        contact: {
            email: org.contactEmail || org.email || "",
            phone: org.contactPhone || "",
            personName: org.contactPersonName || "",
            personPosition: org.contactPersonPosition || "",
            address: org.postalAddress || "",
            website: org.website || "",
            socialMedia: org.socialMediaProfiles || [],
        },
        profile: {
            city: org.city || "",
            country: org.country || "",
            contractingParty: org.contractingParty || "",
            registrationNumber: org.registrationNumber || "",
            yearOfEstablishment: org.yearOfEstablishment || null,
            numberOfStaff: org.numberOfStaff || null,
            numberOfVolunteers: org.numberOfVolunteers || null,
            profileCompleted: org.profileCompleted || false,
            profileCompletedAt: org.profileCompletedAt || null,
            approvedAt: org.approvedAt || null,
        },
        fields: {
            missionFields: org.missionFields || [],
            keywords: org.keywords || [],
            availableResources: org.availableResources || [],
            expertiseOffered: org.expertiseOffered || [],
            expertiseSought: org.expertiseSought || [],
            preferredRole: org.preferredRole || [],
            geographicalCoverage: org.geographicalCoverage || [],
            lookingForPartnersFromCPs: org.lookingForPartnersFromCPs || [],
            lookingForPartnersInThematicAreas: org.lookingForPartnersInThematicAreas || [],
        },
        projects: org.projects || [],
        wbfCallsApplied: org.wbfCallsApplied || [],
        successStories: org.successStories || [],
        referenceProjects: org.referenceProjects || [],
        roleInPastApplications: org.roleInPastApplications || [],
        calls: org.calls || [],
    };
}
router.get("/browse", auth_1.optionalAuthenticateToken, async (req, res) => {
    try {
        const { page = "1", limit = "10", city, contractingParty, country, sector, status, type, minYear, maxYear, minStaff, maxStaff, minVolunteers, maxVolunteers, thematicArea, expertiseOffered, expertiseSought, preferredRole, geographicalCoverage, lookingForPartnersFromCPs, lookingForPartnersInThematicAreas, availableResources, projectStatus, fundingSource, budgetVisibility, visibility, search, hasActiveCall, byCall } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const searcherInfo = req.user
            ? {
                authenticated: true,
                organisationId: req.user.organisationId,
                email: req.user.email,
                role: req.user.role
            }
            : { authenticated: false };
        console.log('[DEBUG] /browse - Search request:', {
            queryParams: req.query,
            searcher: searcherInfo
        });
        let query = mongodb_wrapper_1.organisationsCollection.where("status", "==", status || "approved");
        if (country) {
            query = query.where("profile.city", "==", country);
        }
        if (sector) {
            query = query.where("fields.missionFields", "array-contains", sector);
        }
        if (type) {
            query = query.where("type", "==", type);
        }
        if (thematicArea) {
            query = query.where("fields.thematicAreas", "array-contains", thematicArea);
        }
        if (expertiseOffered) {
            query = query.where("fields.expertiseOffered", "array-contains", expertiseOffered);
        }
        if (expertiseSought) {
            query = query.where("fields.expertiseSought", "array-contains", expertiseSought);
        }
        if (preferredRole) {
            query = query.where("fields.preferredRole", "array-contains", preferredRole);
        }
        if (geographicalCoverage) {
            query = query.where("fields.geographicalCoverage", "array-contains", geographicalCoverage);
        }
        if (availableResources) {
            query = query.where("fields.availableResources", "array-contains", availableResources);
        }
        const snapshot = await query.get();
        let allOrgs = snapshot.docs.map((doc) => groupOrganisationData(doc.data(), doc.id));
        if (city) {
            allOrgs = allOrgs.filter((org) => {
                const orgCity = org.profile?.city?.toLowerCase();
                return orgCity && orgCity.includes(city.toLowerCase());
            });
        }
        if (contractingParty) {
            allOrgs = allOrgs.filter((org) => {
                const orgCP = org.profile?.contractingParty?.toLowerCase();
                return orgCP && orgCP.includes(contractingParty.toLowerCase());
            });
        }
        if (minYear || maxYear) {
            allOrgs = allOrgs.filter((org) => {
                const year = org.profile?.yearOfEstablishment;
                if (!year)
                    return false;
                if (minYear && year < parseInt(minYear))
                    return false;
                if (maxYear && year > parseInt(maxYear))
                    return false;
                return true;
            });
        }
        if (minStaff || maxStaff) {
            allOrgs = allOrgs.filter((org) => {
                const staff = org.profile?.numberOfStaff;
                if (!staff)
                    return false;
                if (minStaff && staff < parseInt(minStaff))
                    return false;
                if (maxStaff && staff > parseInt(maxStaff))
                    return false;
                return true;
            });
        }
        if (minVolunteers || maxVolunteers) {
            allOrgs = allOrgs.filter((org) => {
                const volunteers = org.profile?.numberOfVolunteers;
                if (!volunteers)
                    return false;
                const volunteerNum = typeof volunteers === 'string' ? parseInt(volunteers) : volunteers;
                if (minVolunteers && volunteerNum < parseInt(minVolunteers))
                    return false;
                if (maxVolunteers && volunteerNum > parseInt(maxVolunteers))
                    return false;
                return true;
            });
        }
        if (lookingForPartnersFromCPs) {
            allOrgs = allOrgs.filter((org) => org.fields?.lookingForPartnersFromCPs?.includes(lookingForPartnersFromCPs));
        }
        if (lookingForPartnersInThematicAreas) {
            allOrgs = allOrgs.filter((org) => org.fields?.lookingForPartnersInThematicAreas?.includes(lookingForPartnersInThematicAreas));
        }
        if (search) {
            const searchTerm = search.toLowerCase();
            allOrgs = allOrgs.filter((org) => org.name.toLowerCase().includes(searchTerm) ||
                org.nameLocal?.toLowerCase().includes(searchTerm) ||
                org.fields?.missionFields?.some((field) => field.toLowerCase().includes(searchTerm)) ||
                org.fields?.keywords?.some((keyword) => keyword.toLowerCase().includes(searchTerm)) ||
                org.contact?.personName?.toLowerCase().includes(searchTerm) ||
                org.profile?.city?.toLowerCase().includes(searchTerm) ||
                org.profile?.contractingParty?.toLowerCase().includes(searchTerm));
        }
        const callFilter = byCall || hasActiveCall;
        if (callFilter !== undefined && callFilter !== null && callFilter !== "" && callFilter !== "all") {
            let hasActiveCallBool;
            if (callFilter === "hasCallsOrProjects") {
                hasActiveCallBool = true;
            }
            else if (callFilter === "noCallsOrProjects") {
                hasActiveCallBool = false;
            }
            else {
                const callFilterStr = String(callFilter);
                hasActiveCallBool = callFilterStr === "true" || callFilterStr === "1";
            }
            allOrgs = allOrgs.filter((org) => {
                const isActive = (item) => {
                    if (item.status === "active")
                        return true;
                    if (item.status === "closed" || item.status === "draft")
                        return false;
                    if (item.deadline) {
                        let deadlineDate;
                        if (item.deadline instanceof Date) {
                            deadlineDate = item.deadline;
                        }
                        else if (item.deadline._seconds) {
                            deadlineDate = new Date(item.deadline._seconds * 1000);
                        }
                        else if (typeof item.deadline === "string") {
                            deadlineDate = new Date(item.deadline);
                        }
                        else {
                            return false;
                        }
                        return deadlineDate > new Date();
                    }
                    return false;
                };
                const calls = org.calls || [];
                const hasActiveCall = calls.some((call) => isActive(call));
                const projects = org.projects || [];
                const hasActiveProject = projects.some((project) => isActive(project));
                const hasActive = hasActiveCall || hasActiveProject;
                return hasActive === hasActiveCallBool;
            });
        }
        const total = allOrgs.length;
        const totalPages = Math.ceil(total / limitNum);
        const startIdx = (pageNum - 1) * limitNum;
        const pagedOrgs = allOrgs.slice(startIdx, startIdx + limitNum);
        let enrichedOrgs = pagedOrgs;
        if (req.user?.organisationId) {
            try {
                console.log(`[DEBUG] /browse - Checking favorites for organisationId: ${req.user.organisationId}`);
                const currentOrgDoc = await mongodb_wrapper_1.organisationsCollection.doc(req.user.organisationId).get();
                if (currentOrgDoc.exists) {
                    const currentOrgData = currentOrgDoc.data();
                    const favoriteIds = (currentOrgData?.favorites || []);
                    const favoriteSet = new Set(favoriteIds);
                    console.log(`[DEBUG] /browse - Found ${favoriteIds.length} favorites for authenticated user`);
                    enrichedOrgs = pagedOrgs.map((org) => ({
                        ...org,
                        isFavorite: favoriteSet.has(org.id)
                    }));
                }
                else {
                    console.log(`[DEBUG] /browse - Organisation document not found for ID: ${req.user.organisationId}`);
                    enrichedOrgs = pagedOrgs.map((org) => ({
                        ...org,
                        isFavorite: false
                    }));
                }
            }
            catch (error) {
                console.error("Error checking favorites:", error);
                enrichedOrgs = pagedOrgs.map((org) => ({
                    ...org,
                    isFavorite: false
                }));
            }
        }
        else {
            console.log(`[DEBUG] /browse - No authentication token provided, returning organisations without favorite status`);
            enrichedOrgs = pagedOrgs.map((org) => ({
                ...org,
                isFavorite: false
            }));
        }
        return res.json({
            success: true,
            data: {
                organisations: enrichedOrgs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasMore: pageNum < totalPages,
                },
            },
        });
    }
    catch (error) {
        console.error("[ERROR] Browse organisations error:", error);
        return res.status(500).json({
            success: false,
            error: process.env.NODE_ENV === "production" ? "Failed to browse organisations" : error.message,
        });
    }
});
router.get("/all", auth_1.authenticateToken, async (req, res) => {
    try {
        const { search, limit = "50" } = req.query;
        const limitNum = parseInt(limit) || 50;
        let query = mongodb_wrapper_1.organisationsCollection.where('status', '==', 'approved');
        const snapshot = await query.limit(limitNum * 2).get();
        let organisations = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                logo: data.images?.logo || data.logo,
                description: data.description,
                city: data.profile?.city,
                country: data.profile?.country,
                website: data.contact?.website,
                email: data.contact?.email,
                missionFields: data.profile?.missionFields || [],
                organisationType: data.profile?.organisationType
            };
        });
        if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            organisations = organisations.filter((org) => org.name?.toLowerCase().includes(searchLower) ||
                org.description?.toLowerCase().includes(searchLower) ||
                org.city?.toLowerCase().includes(searchLower) ||
                org.country?.toLowerCase().includes(searchLower) ||
                org.organisationType?.toLowerCase().includes(searchLower));
        }
        organisations = organisations.slice(0, limitNum);
        return res.json({
            success: true,
            data: { organisations }
        });
    }
    catch (error) {
        console.error("Get all organisations error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch organisations"
        });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(id).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }
        const orgData = orgDoc.data();
        const organisationData = groupOrganisationData(orgData, orgDoc.id);
        return res.json({
            success: true,
            data: organisationData,
        });
    }
    catch (error) {
        console.error("Get organisation error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get organisation",
        });
    }
});
router.get("/me/profile", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(req.user.organisationId).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }
        const orgData = orgDoc.data();
        return res.json({
            success: true,
            data: {
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    organisationId: req.user.organisationId,
                    role: req.user.role,
                },
                organisation: groupOrganisationData(orgData, orgDoc.id)
            }
        });
    }
    catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get profile",
        });
    }
});
router.put("/:id/edit", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user?.organisationId !== id) {
            return res.status(403).json({
                success: false,
                error: "Access denied",
            });
        }
        const { error, value } = updateOrganisationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }
        const updateData = value;
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(id).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }
        const orgData = orgDoc.data();
        if (orgData.status !== "declined") {
            return res.status(400).json({
                success: false,
                error: "Can only edit declined profiles",
            });
        }
        const updatedData = {
            ...updateData,
            status: "pending",
            updatedAt: new Date(),
            feedback: undefined,
            adminId: undefined,
            reviewedAt: undefined,
        };
        await mongodb_wrapper_1.organisationsCollection.doc(id).update(updatedData);
        return res.json({
            success: true,
            data: {
                message: "Profile updated and resubmitted for review",
            },
        });
    }
    catch (error) {
        console.error("Update organisation error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to update organisation",
        });
    }
});
router.post("/complete-profile", auth_1.authenticateToken, auth_1.requireOrganisationForProfile, async (req, res) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }
        const { error, value } = completeProfileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }
        const convertedValue = {
            ...value,
            numberOfStaff: value.numberOfStaff && typeof value.numberOfStaff === 'string' && !value.numberOfStaff.includes('-') ? parseInt(value.numberOfStaff, 10) : value.numberOfStaff,
            numberOfVolunteers: value.numberOfVolunteers && typeof value.numberOfVolunteers === 'string' && !value.numberOfVolunteers.includes('-') ? parseInt(value.numberOfVolunteers, 10) : value.numberOfVolunteers,
            yearOfEstablishment: typeof value.yearOfEstablishment === 'string' ? parseInt(value.yearOfEstablishment, 10) : value.yearOfEstablishment,
            wbfCallsApplied: value.wbfCallsApplied ? value.wbfCallsApplied.map((call) => ({
                ...call,
                year: typeof call.year === 'string' ? parseInt(call.year, 10) : call.year
            })) : null
        };
        const cleanProfileData = {};
        Object.keys(convertedValue).forEach((key) => {
            if (convertedValue[key] !== undefined) {
                cleanProfileData[key] = convertedValue[key];
            }
        });
        const profileData = cleanProfileData;
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(req.user.organisationId).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }
        const orgData = orgDoc.data();
        const updatedData = {
            name: orgData.name,
            nameLocal: profileData.nameLocal,
            contractingParty: profileData.contractingParty,
            city: profileData.city,
            type: profileData.type,
            yearOfEstablishment: profileData.yearOfEstablishment,
            ...(profileData.postalAddress !== null && profileData.postalAddress !== undefined && { postalAddress: profileData.postalAddress }),
            ...(profileData.registrationNumber !== null && profileData.registrationNumber !== undefined && { registrationNumber: profileData.registrationNumber }),
            ...(profileData.numberOfStaff !== null && profileData.numberOfStaff !== undefined && { numberOfStaff: profileData.numberOfStaff }),
            ...(profileData.numberOfVolunteers !== null && profileData.numberOfVolunteers !== undefined && { numberOfVolunteers: profileData.numberOfVolunteers }),
            ...(profileData.missionFields !== null && profileData.missionFields !== undefined && { missionFields: profileData.missionFields }),
            ...(profileData.website !== null && profileData.website !== undefined && { website: profileData.website }),
            ...(profileData.socialMediaProfiles !== null && profileData.socialMediaProfiles !== undefined && { socialMediaProfiles: profileData.socialMediaProfiles }),
            contactPersonName: profileData.contactPersonName,
            contactEmail: profileData.contactEmail,
            ...(profileData.contactPersonPosition !== null && profileData.contactPersonPosition !== undefined && { contactPersonPosition: profileData.contactPersonPosition }),
            ...(profileData.contactPhone !== null && profileData.contactPhone !== undefined && { contactPhone: profileData.contactPhone }),
            ...(profileData.wbfCallsApplied !== null && profileData.wbfCallsApplied !== undefined && { wbfCallsApplied: profileData.wbfCallsApplied }),
            ...(profileData.roleInPastApplications !== null && profileData.roleInPastApplications !== undefined && { roleInPastApplications: profileData.roleInPastApplications }),
            ...(profileData.projects !== null && profileData.projects !== undefined && { projects: profileData.projects }),
            ...(profileData.projectThematicAreas !== null && profileData.projectThematicAreas !== undefined && { projectThematicAreas: profileData.projectThematicAreas }),
            ...(profileData.geographicalCoverage !== null && profileData.geographicalCoverage !== undefined && { geographicalCoverage: profileData.geographicalCoverage }),
            ...(profileData.lookingForPartnersInThematicAreas !== null && profileData.lookingForPartnersInThematicAreas !== undefined && { lookingForPartnersInThematicAreas: profileData.lookingForPartnersInThematicAreas }),
            ...(profileData.lookingForPartnersFromCPs !== null && profileData.lookingForPartnersFromCPs !== undefined && { lookingForPartnersFromCPs: profileData.lookingForPartnersFromCPs }),
            ...(profileData.preferredRole !== null && profileData.preferredRole !== undefined && { preferredRole: profileData.preferredRole }),
            ...(profileData.expertiseOffered !== null && profileData.expertiseOffered !== undefined && { expertiseOffered: profileData.expertiseOffered }),
            ...(profileData.expertiseSought !== null && profileData.expertiseSought !== undefined && { expertiseSought: profileData.expertiseSought }),
            ...(profileData.keywords !== null && profileData.keywords !== undefined && { keywords: profileData.keywords }),
            ...(profileData.availableResources !== null && profileData.availableResources !== undefined && { availableResources: profileData.availableResources }),
            ...(profileData.referenceProjects !== null && profileData.referenceProjects !== undefined && { referenceProjects: profileData.referenceProjects }),
            ...(profileData.successStories !== null && profileData.successStories !== undefined && { successStories: profileData.successStories }),
            ...(profileData.partnershipNotes !== null && profileData.partnershipNotes !== undefined && { partnershipNotes: profileData.partnershipNotes }),
            logo: (profileData.logoUrl && profileData.logoUrl.trim() !== '') ? profileData.logoUrl : (orgData.logo || ''),
            cover: (profileData.coverUrl && profileData.coverUrl.trim() !== '') ? profileData.coverUrl : (orgData.cover || ''),
            status: "approved",
            updatedAt: new Date(),
            profileCompleted: true,
            profileCompletedAt: new Date(),
            approvedAt: new Date(),
        };
        const cleanUpdateData = {};
        Object.keys(updatedData).forEach((key) => {
            if (updatedData[key] !== undefined) {
                cleanUpdateData[key] = updatedData[key];
            }
        });
        await mongodb_wrapper_1.organisationsCollection.doc(req.user.organisationId).update(cleanUpdateData);
        return res.json({
            success: true,
            data: {
                message: "Profile completed successfully and approved! You can now access the platform.",
                organisationId: req.user.organisationId,
            },
        });
    }
    catch (error) {
        console.error("Complete profile error:", error);
        console.error("Error stack:", error?.stack);
        console.error("Error details:", {
            message: error?.message,
            name: error?.name,
            code: error?.code,
        });
        return res.status(500).json({
            success: false,
            error: process.env.NODE_ENV === "production"
                ? "Failed to complete profile"
                : error?.message || "Failed to complete profile",
        });
    }
});
router.get("/opportunities/all", async (req, res) => {
    try {
        const { type, page = "1", limit = "12", sortBy = "deadline-asc", status, searchTerm, thematicAreas, locations, budgetMin, budgetMax, includeFinished = "false", organisationId } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 12;
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
        if (budgetMin || budgetMax) {
            filteredOpportunities = filteredOpportunities.filter(op => {
                if (!op.budget)
                    return false;
                const min = budgetMin ? parseInt(budgetMin) : 0;
                const max = budgetMax ? parseInt(budgetMax) : Infinity;
                return op.budget.min >= min && op.budget.max <= max;
            });
        }
        if (!includeFinishedBool) {
            const now = new Date();
            filteredOpportunities = filteredOpportunities.filter(op => {
                if (!op.deadline)
                    return true;
                const deadline = op.deadline._seconds ?
                    new Date(op.deadline._seconds * 1000) :
                    new Date(op.deadline);
                return deadline >= now;
            });
        }
        filteredOpportunities.sort((a, b) => {
            switch (sortBy) {
                case "deadline-asc":
                    const aDeadline = a.deadline?._seconds ? new Date(a.deadline._seconds * 1000) : new Date(a.deadline || 0);
                    const bDeadline = b.deadline?._seconds ? new Date(b.deadline._seconds * 1000) : new Date(b.deadline || 0);
                    return aDeadline.getTime() - bDeadline.getTime();
                case "deadline-desc":
                    const aDeadlineDesc = a.deadline?._seconds ? new Date(a.deadline._seconds * 1000) : new Date(a.deadline || 0);
                    const bDeadlineDesc = b.deadline?._seconds ? new Date(b.deadline._seconds * 1000) : new Date(b.deadline || 0);
                    return bDeadlineDesc.getTime() - aDeadlineDesc.getTime();
                case "title-asc":
                    return (a.title || "").localeCompare(b.title || "");
                case "title-desc":
                    return (b.title || "").localeCompare(a.title || "");
                case "created-desc":
                    const aCreated = a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(a.createdAt || 0);
                    const bCreated = b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(b.createdAt || 0);
                    return bCreated.getTime() - aCreated.getTime();
                case "created-asc":
                    const aCreatedAsc = a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(a.createdAt || 0);
                    const bCreatedAsc = b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(b.createdAt || 0);
                    return aCreatedAsc.getTime() - bCreatedAsc.getTime();
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
        const startIdx = (pageNum - 1) * limitNum;
        const paginatedOpportunities = filteredOpportunities.slice(startIdx, startIdx + limitNum);
        res.json({
            success: true,
            data: {
                opportunities: paginatedOpportunities,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasMore: pageNum < totalPages
                },
            },
        });
    }
    catch (error) {
        console.error("Get all opportunities error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch opportunities",
        });
    }
});
router.get("/me/opportunities", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }
        const { type, page = "1", limit = "10" } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(req.user.organisationId).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }
        const orgData = orgDoc.data();
        let opportunities = [];
        const calls = orgData?.calls || [];
        const projects = orgData?.projects || [];
        if (type === 'call') {
            opportunities = calls;
        }
        else if (type === 'project') {
            opportunities = projects;
        }
        else {
            opportunities = [
                ...calls.map((call) => ({ ...call, type: 'call' })),
                ...projects.map((project) => ({ ...project, type: 'project' }))
            ];
        }
        opportunities.sort((a, b) => {
            const aDate = a.deadline?._seconds ? new Date(a.deadline._seconds * 1000) :
                a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(0);
            const bDate = b.deadline?._seconds ? new Date(b.deadline._seconds * 1000) :
                b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(0);
            return aDate.getTime() - bDate.getTime();
        });
        const total = opportunities.length;
        const totalPages = Math.ceil(total / limitNum);
        const startIdx = (pageNum - 1) * limitNum;
        const paginatedOpportunities = opportunities.slice(startIdx, startIdx + limitNum);
        return res.json({
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
    }
    catch (error) {
        console.error("Get organization opportunities error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch opportunities",
        });
    }
});
router.post("/fix-image-urls", auth_1.authenticateToken, auth_1.requireOrganisationForProfile, async (req, res) => {
    return res.status(503).json({
        success: false,
        error: "Image fix service is unavailable (Firebase Storage removed)."
    });
});
router.post('/favorites/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required"
            });
        }
        if (req.user.role !== "organisation") {
            return res.status(403).json({
                success: false,
                error: "Organisation access required"
            });
        }
        const organisationDoc = await resolveOrganisationDocument(req);
        if (!organisationDoc) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found"
            });
        }
        const organisationId = organisationDoc.id;
        const targetOrganisationId = req.params.id;
        await mongodb_wrapper_1.organisationsCollection.doc(organisationId).update({
            favorites: mongodb_wrapper_2.FieldValue.arrayUnion(targetOrganisationId),
            updatedAt: mongodb_wrapper_2.Timestamp.now()
        });
        return res.json({
            success: true,
            data: { message: "Organisation added to favorites" }
        });
    }
    catch (error) {
        console.error("Error adding favorite:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to add favorite"
        });
    }
});
router.delete('/favorites/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required"
            });
        }
        if (req.user.role !== "organisation") {
            return res.status(403).json({
                success: false,
                error: "Organisation access required"
            });
        }
        const organisationDoc = await resolveOrganisationDocument(req);
        if (!organisationDoc) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found"
            });
        }
        const organisationId = organisationDoc.id;
        const targetOrganisationId = req.params.id;
        await mongodb_wrapper_1.organisationsCollection.doc(organisationId).update({
            favorites: mongodb_wrapper_2.FieldValue.arrayRemove(targetOrganisationId),
            updatedAt: mongodb_wrapper_2.Timestamp.now()
        });
        return res.json({
            success: true,
            data: { message: "Organisation removed from favorites" }
        });
    }
    catch (error) {
        console.error("Error removing favorite:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to remove favorite"
        });
    }
});
router.get('/favorites', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('[DEBUG] /favorites - Request received', {
            hasUser: !!req.user,
            userId: req.user?.id,
            organisationId: req.user?.organisationId,
            email: req.user?.email,
            role: req.user?.role
        });
        if (!req.user) {
            console.log('[DEBUG] /favorites - No user in request');
            return res.status(401).json({
                success: false,
                error: "Authentication required"
            });
        }
        if (req.user.role !== "organisation") {
            console.log('[DEBUG] /favorites - Invalid role', { role: req.user.role });
            return res.status(403).json({
                success: false,
                error: "Organisation access required"
            });
        }
        const organisationDoc = await resolveOrganisationDocument(req);
        if (!organisationDoc) {
            console.log('[DEBUG] /favorites - Organisation document not found after resolution attempt');
            return res.status(404).json({
                success: false,
                error: "Organisation not found"
            });
        }
        const organisationId = organisationDoc.id;
        console.log(`[DEBUG] /favorites - Found organisation with ID: ${organisationId}`);
        const orgData = organisationDoc.data();
        const favoriteIds = orgData.favorites || [];
        console.log(`[DEBUG] /favorites - Found ${favoriteIds.length} favorite IDs:`, favoriteIds);
        if (favoriteIds.length === 0) {
            return res.json({
                success: true,
                data: { organisations: [] }
            });
        }
        const favoriteOrgs = [];
        for (const favId of favoriteIds) {
            const favDoc = await mongodb_wrapper_1.organisationsCollection.doc(favId).get();
            if (favDoc.exists) {
                const favData = favDoc.data();
                favoriteOrgs.push({
                    id: favDoc.id,
                    name: favData.name,
                    nameLocal: favData.nameLocal,
                    logo: favData.images?.logo || favData.logo || '',
                    country: favData.profile?.country || '',
                    city: favData.profile?.city || '',
                    type: favData.type || '',
                    missionFields: favData.fields?.missionFields || []
                });
            }
        }
        return res.json({
            success: true,
            data: { organisations: favoriteOrgs }
        });
    }
    catch (error) {
        console.error("Error getting favorites:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get favorites"
        });
    }
});
exports.default = router;
//# sourceMappingURL=organisation.js.map