import { Router, Request, Response, NextFunction } from "express";
import Joi from "joi";
import { organisationsCollection } from "../services/mongodb-wrapper";
import { FieldValue, Timestamp } from "../services/mongodb-wrapper";
import { authenticateToken, requireOrganisation, requireOrganisationForProfile, optionalAuthenticateToken } from "../middleware/auth";
import { ApiResponse, Organisation, RegisterStep2Request } from "../types";
import multer from "multer";
import { uploadToS3, deleteFromS3 } from "../services/storage";

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

type OrganisationDoc = {
    exists: boolean;
    data: () => any;
    id: string;
};

const getOrganisationById = async (organisationId: string) => {
    const orgDoc = await organisationsCollection.doc(organisationId).get();
    if (!orgDoc.exists) {
        return null;
    }
    return {
        id: orgDoc.id,
        data: orgDoc.data() as Organisation & {
            images?: Record<string, any>;
            logoPath?: string;
            coverPath?: string;
            projects?: any[];
            successStories?: any[];
        },
    };
};

const resolveOrganisationDocument = async (req: Request): Promise<OrganisationDoc | null> => {
    if (!req.user) {
        console.log('[DEBUG] resolveOrganisationDocument - No user in request');
        return null;
    }

    console.log('[DEBUG] resolveOrganisationDocument - Starting lookup', {
        organisationId: req.user.organisationId,
        email: req.user.email,
        role: req.user.role
    });

    const fetchById = async (id?: string | null): Promise<OrganisationDoc | null> => {
        if (!id) {
            return null;
        }
        const doc = await organisationsCollection.doc(id).get();
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

    const emailCandidates = new Set<string>();
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
        if (!email) continue;

        let query = await organisationsCollection
            .where("contactEmail", "==", email)
            .limit(1)
            .get();

        console.log('[DEBUG] resolveOrganisationDocument - contactEmail query', {
            email,
            found: !query.empty
        });

        if (query.empty) {
            query = await organisationsCollection
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

// POST /organisation/upload-logo
// @ts-ignore
router.post("/upload-logo", authenticateToken, requireOrganisationForProfile, upload.single('logo'), async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Logo file is required",
            });
        }

        const organisation = await getOrganisationById(req.user.organisationId);
        if (!organisation) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const { url, key } = await uploadToS3({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            folder: `organisations/${organisation.id}/logo`,
        });

        const previousPath = organisation.data?.images?.logoPath || organisation.data?.logoPath;
        if (previousPath) {
            await deleteFromS3(previousPath);
        }

        const updatedImages = {
            ...(organisation.data.images || {}),
            logo: url,
            logoPath: key,
        };

        await organisationsCollection.doc(organisation.id).update({
            logo: url,
            logoUrl: url,
            images: updatedImages,
            logoPath: key,
            updatedAt: new Date(),
        });

        return res.json({
            success: true,
            data: {
                url,
                path: key,
            },
        });
    } catch (error) {
        console.error("Upload logo error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to upload logo",
        });
    }
}) as any;

// POST /organisation/upload-cover
// @ts-ignore
router.post("/upload-cover", authenticateToken, requireOrganisationForProfile, upload.single('cover'), async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Cover image is required",
            });
        }

        const organisation = await getOrganisationById(req.user.organisationId);
        if (!organisation) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const { url, key } = await uploadToS3({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            folder: `organisations/${organisation.id}/cover`,
        });

        const previousPath = organisation.data?.images?.coverPath || organisation.data?.coverPath;
        if (previousPath) {
            await deleteFromS3(previousPath);
        }

        const updatedImages = {
            ...(organisation.data.images || {}),
            cover: url,
            coverPath: key,
        };

        await organisationsCollection.doc(organisation.id).update({
            cover: url,
            coverUrl: url,
            coverImage: url,
            images: updatedImages,
            coverPath: key,
            updatedAt: new Date(),
        });

        return res.json({
            success: true,
            data: {
                url,
                path: key,
            },
        });
    } catch (error) {
        console.error("Upload cover error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to upload cover image",
        });
    }
}) as any;

// POST /organisation/delete-cover
router.post("/delete-cover", authenticateToken, requireOrganisationForProfile, async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        const { path: objectPath } = req.body;
        if (!objectPath) {
            return res.status(400).json({
                success: false,
                error: "Cover path is required",
            });
        }

        const organisation = await getOrganisationById(req.user.organisationId);
        if (!organisation) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        await deleteFromS3(objectPath);

        const updatedImages = {
            ...(organisation.data.images || {}),
        };

        const shouldClear =
            !objectPath ||
            updatedImages.coverPath === objectPath ||
            organisation.data.coverPath === objectPath;

        if (shouldClear) {
            updatedImages.cover = "";
            updatedImages.coverPath = "";
        }

        const updatePayload: Record<string, any> = {
            images: updatedImages,
            updatedAt: new Date(),
        };

        if (shouldClear) {
            updatePayload.cover = "";
            updatePayload.coverUrl = "";
            updatePayload.coverImage = "";
            updatePayload.coverPath = "";
        }

        await organisationsCollection.doc(organisation.id).update(updatePayload);

        return res.json({
            success: true,
            data: {
                message: "Cover image deleted successfully",
            },
        });
    } catch (error) {
        console.error("Delete cover error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to delete cover image",
        });
    }
});

// POST /organisation/delete-logo
router.post("/delete-logo", authenticateToken, requireOrganisationForProfile, async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        const { path: objectPath } = req.body;
        if (!objectPath) {
            return res.status(400).json({
                success: false,
                error: "Logo path is required",
            });
        }

        const organisation = await getOrganisationById(req.user.organisationId);
        if (!organisation) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        await deleteFromS3(objectPath);

        const updatedImages = {
            ...(organisation.data.images || {}),
        };

        const shouldClear =
            !objectPath ||
            updatedImages.logoPath === objectPath ||
            organisation.data.logoPath === objectPath;

        if (shouldClear) {
            updatedImages.logo = "";
            updatedImages.logoPath = "";
        }

        const updatePayload: Record<string, any> = {
            images: updatedImages,
            updatedAt: new Date(),
        };

        if (shouldClear) {
            updatePayload.logo = "";
            updatePayload.logoUrl = "";
            updatePayload.logoPath = "";
        }

        await organisationsCollection.doc(organisation.id).update(updatePayload);

        return res.json({
            success: true,
            data: {
                message: "Logo deleted successfully",
            },
        });
    } catch (error) {
        console.error("Delete logo error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to delete logo",
        });
    }
});

// POST /organisation/upload-project-image
// @ts-ignore
router.post("/upload-project-image", authenticateToken, requireOrganisationForProfile, upload.single('image'), async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Project image is required",
            });
        }

        const projectIndex = Number(req.body.projectIndex);
        if (Number.isNaN(projectIndex)) {
            return res.status(400).json({
                success: false,
                error: "Project index is required",
            });
        }

        const organisation = await getOrganisationById(req.user.organisationId);
        if (!organisation) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const projects: any[] = Array.isArray(organisation.data.projects)
            ? [...organisation.data.projects]
            : [];
        if (!projects[projectIndex]) {
            return res.status(400).json({
                success: false,
                error: "Project not found for the given index",
            });
        }

        const { url, key } = await uploadToS3({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            folder: `organisations/${organisation.id}/projects/${projectIndex}`,
        });

        const previousPath = projects[projectIndex]?.imagePath;
        if (previousPath) {
            await deleteFromS3(previousPath);
        }

        projects[projectIndex] = {
            ...projects[projectIndex],
            imageUrl: url,
            imagePath: key,
        };

        await organisationsCollection.doc(organisation.id).update({
            projects,
            updatedAt: new Date(),
        });

        return res.json({
            success: true,
            data: {
                url,
                path: key,
            },
        });
    } catch (error) {
        console.error("Upload project image error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to upload project image",
        });
    }
});

// POST /organisation/delete-project-image
// @ts-ignore
router.post("/delete-project-image", authenticateToken, requireOrganisationForProfile, async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        const { path: objectPath } = req.body;
        if (!objectPath) {
            return res.status(400).json({
                success: false,
                error: "Image path is required",
            });
        }

        const organisation = await getOrganisationById(req.user.organisationId);
        if (!organisation) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const currentProjects: any[] = Array.isArray(organisation.data.projects)
            ? organisation.data.projects
            : [];

        const projects = currentProjects.map((project: any) => {
            if (project && typeof project === "object" && project.imagePath === objectPath) {
                return {
                    ...project,
                    imageUrl: "",
                    imagePath: "",
                };
            }
            return project;
        });

        await deleteFromS3(objectPath);

        await organisationsCollection.doc(organisation.id).update({
            projects,
            updatedAt: new Date(),
        });

        return res.json({
            success: true,
            data: {
                message: "Project image deleted successfully",
            },
        });
    } catch (error) {
        console.error("Delete project image error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to delete project image",
        });
    }
});

// POST /organisation/upload-success-story-image
// @ts-ignore
router.post("/upload-success-story-image", authenticateToken, requireOrganisationForProfile, upload.single('image'), async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Image is required",
            });
        }

        const storyIndex = Number(req.body.storyIndex);
        if (Number.isNaN(storyIndex)) {
            return res.status(400).json({
                success: false,
                error: "Success story index is required",
            });
        }

        const organisation = await getOrganisationById(req.user.organisationId);
        if (!organisation) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const successStories: any[] = Array.isArray(organisation.data.successStories)
            ? [...organisation.data.successStories]
            : [];
        if (!successStories[storyIndex]) {
            return res.status(400).json({
                success: false,
                error: "Success story not found for the given index",
            });
        }

        const { url, key } = await uploadToS3({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            folder: `organisations/${organisation.id}/success-stories/${storyIndex}`,
        });

        const previousPath =
            successStories[storyIndex] &&
            typeof successStories[storyIndex] === "object" &&
            successStories[storyIndex] !== null
                ? successStories[storyIndex].imagePath
                : undefined;
        if (previousPath) {
            await deleteFromS3(previousPath);
        }

        const updatedStory =
            successStories[storyIndex] && typeof successStories[storyIndex] === "object"
                ? { ...successStories[storyIndex] }
                : {
                      title: "",
                      description:
                          typeof successStories[storyIndex] === "string"
                              ? successStories[storyIndex]
                              : "",
                  };

        successStories[storyIndex] = {
            ...updatedStory,
            imageUrl: url,
            imagePath: key,
        };

        await organisationsCollection.doc(organisation.id).update({
            successStories,
            updatedAt: new Date(),
        });

        return res.json({
            success: true,
            data: {
                url,
                path: key,
            },
        });
    } catch (error) {
        console.error("Upload success story image error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to upload success story image",
        });
    }
});

// POST /organisation/delete-success-story-image
router.post("/delete-success-story-image", authenticateToken, requireOrganisationForProfile, async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        const { path: objectPath } = req.body;
        if (!objectPath) {
            return res.status(400).json({
                success: false,
                error: "Image path is required",
            });
        }

        const organisation = await getOrganisationById(req.user.organisationId);
        if (!organisation) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const successStoriesRaw: any[] = Array.isArray(organisation.data.successStories)
            ? organisation.data.successStories
            : [];

        const successStories = successStoriesRaw.map((story: any) => {
            if (story && typeof story === "object" && story.imagePath === objectPath) {
                return {
                    ...story,
                    imageUrl: "",
                    imagePath: "",
                };
            }
            return story;
        });

        await deleteFromS3(objectPath);

        await organisationsCollection.doc(organisation.id).update({
            successStories,
            updatedAt: new Date(),
        });

        return res.json({
            success: true,
            data: {
                message: "Success story image deleted successfully",
            },
        });
    } catch (error) {
        console.error("Delete success story image error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to delete success story image",
        });
    }
});

// Validation schema for organisation updates
const updateOrganisationSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    nameLocal: Joi.string().min(2).max(100).optional(),
    contractingParty: Joi.string().optional(),
    city: Joi.string().optional(),
    postalAddress: Joi.string().optional(),
    type: Joi.string().optional(),
    yearOfEstablishment: Joi.alternatives().try(
        Joi.number().integer().min(1900).max(new Date().getFullYear()),
        Joi.string().pattern(/^\d{4}$/)
    ).optional(),
    registrationNumber: Joi.string().optional().allow(null, ''),
    numberOfStaff: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().pattern(/^\d+$|^\d+-\d+$/)
    ).optional(),
    numberOfVolunteers: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().pattern(/^\d+$|^\d+-\d+$/)
    ).optional(),
    missionFields: Joi.array().items(Joi.string()).optional(),
    website: Joi.string().uri().optional().allow(null, ''),
    socialMediaProfiles: Joi.array().items(Joi.string()).optional().allow(null),
    contactPersonName: Joi.string().optional(),
    contactPersonPosition: Joi.string().optional().allow(null, ''),
    contactEmail: Joi.string().email().optional(),
    contactPhone: Joi.string().optional().allow(null, ''),
    wbfCallsApplied: Joi.array().items(Joi.object({
        callNumber: Joi.string().required(),
        year: Joi.alternatives().try(
            Joi.number().integer(),
            Joi.string().pattern(/^\d{4}$/)
        ).required(),
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

// Validation schema for complete profile submission
const completeProfileSchema = Joi.object({
    // name is optional - it's already set during registration and shouldn't be changed
    name: Joi.string().min(2).max(100).optional(),
    nameLocal: Joi.string().min(2).max(100).required(),
    contractingParty: Joi.string().min(2).max(100).required(),
    city: Joi.string().min(2).max(100).required(),
    postalAddress: Joi.string().optional().allow(null, ''),
    type: Joi.string().required(),
    yearOfEstablishment: Joi.alternatives().try(
        Joi.number().integer().min(1900).max(new Date().getFullYear()),
        Joi.string().pattern(/^\d{4}$/)
    ).required(),
    registrationNumber: Joi.string().optional().allow(null, ''),
    logoUrl: Joi.alternatives().try(
        Joi.string().uri(),
        Joi.string().allow('', null)
    ).optional(),
    coverUrl: Joi.alternatives().try(
        Joi.string().uri(),
        Joi.string().allow('', null)
    ).optional(),
    numberOfStaff: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().pattern(/^\d+$|^\d+-\d+$/)
    ).optional().allow(null, ''),
    numberOfVolunteers: Joi.alternatives().try(
        Joi.number().integer().min(0),
        Joi.string().pattern(/^\d+-\d+$|^\d+$/)
    ).optional().allow(null, ''),
    missionFields: Joi.array().items(Joi.string()).optional().allow(null),
    website: Joi.string().uri().optional().allow(null, ''),
    socialMediaProfiles: Joi.array().items(Joi.string()).optional().allow(null),
    contactPersonName: Joi.string().min(2).max(100).required(),
    contactPersonPosition: Joi.string().optional().allow(null, ''),
    contactEmail: Joi.string().email().required(),
    contactPhone: Joi.string().optional().allow(null, ''),
    wbfCallsApplied: Joi.array().items(Joi.object({
        callNumber: Joi.string().required(),
        year: Joi.alternatives().try(
            Joi.number().integer(),
            Joi.string().pattern(/^\d{4}$/)
        ).required(),
    })).optional().allow(null),
    roleInPastApplications: Joi.array().items(Joi.string().valid('Lead', 'Partner')).optional().allow(null),
    projects: Joi.array().items(Joi.object({
        title: Joi.string().optional(),
        description: Joi.string().optional(),
        imageUrl: Joi.string().optional(),
        imagePath: Joi.string().optional(),
    })).optional().allow(null),
    projectTitles: Joi.array().items(Joi.string()).optional().allow(null),
    projectDescriptions: Joi.array().items(Joi.string()).optional().allow(null),
    projectThematicAreas: Joi.array().items(Joi.string()).optional().allow(null),
    geographicalCoverage: Joi.array().items(Joi.string()).optional().allow(null),
    lookingForPartnersInThematicAreas: Joi.array().items(Joi.string()).optional().allow(null),
    lookingForPartnersFromCPs: Joi.array().items(Joi.string()).optional().allow(null),
    preferredRole: Joi.array().items(Joi.string().valid('Lead', 'Partner', 'Either')).optional().allow(null),
    expertiseOffered: Joi.array().items(Joi.string()).optional().allow(null),
    expertiseSought: Joi.array().items(Joi.string()).optional().allow(null),
    keywords: Joi.array().items(Joi.string()).optional().allow(null),
    availableResources: Joi.array().items(Joi.string()).optional().allow(null),
    referenceProjects: Joi.array().items(Joi.string()).optional().allow(null),
    successStories: Joi.array().items(Joi.string()).optional().allow(null),
    partnershipNotes: Joi.string().optional().allow(null, ''),
});

// Helper to group organisation data for API response
export function groupOrganisationData(org: any, id: string) {
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

// GET /organisation/browse (list approved organisations)
router.get("/browse", optionalAuthenticateToken, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const {
            page = "1",
            limit = "10",
            city,
            contractingParty,
            country,
            sector,
            status,
            type,
            minYear,
            maxYear,
            minStaff,
            maxStaff,
            minVolunteers,
            maxVolunteers,
            thematicArea,
            expertiseOffered,
            expertiseSought,
            preferredRole,
            geographicalCoverage,
            lookingForPartnersFromCPs,
            lookingForPartnersInThematicAreas,
            availableResources,
            projectStatus,
            fundingSource,
            budgetVisibility,
            visibility,
            search,
            hasActiveCall,
            byCall
        } = req.query;

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;

        // Track who is searching (for analytics/logging purposes)
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

        // Start with approved organisations
        let query: any = organisationsCollection.where("status", "==", status || "approved");

        // Apply filters that can be done at database level
        if (country) {
            query = query.where("country", "==", country);
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
        let allOrgs = snapshot.docs.map((doc: any) => groupOrganisationData(doc.data(), doc.id));

        // Apply client-side filters for complex queries
        if (city) {
            allOrgs = allOrgs.filter((org: any) => {
                const orgCity = org.profile?.city?.toLowerCase();
                return orgCity && orgCity.includes((city as string).toLowerCase());
            });
        }

        if (contractingParty) {
            allOrgs = allOrgs.filter((org: any) => {
                const orgCP = org.profile?.contractingParty?.toLowerCase();
                return orgCP && orgCP.includes((contractingParty as string).toLowerCase());
            });
        }

        if (minYear || maxYear) {
            allOrgs = allOrgs.filter((org: any) => {
                const year = org.profile?.yearOfEstablishment;
                if (!year) return false;
                if (minYear && year < parseInt(minYear as string)) return false;
                if (maxYear && year > parseInt(maxYear as string)) return false;
                return true;
            });
        }

        if (minStaff || maxStaff) {
            allOrgs = allOrgs.filter((org: any) => {
                const staff = org.profile?.numberOfStaff;
                if (!staff) return false;
                if (minStaff && staff < parseInt(minStaff as string)) return false;
                if (maxStaff && staff > parseInt(maxStaff as string)) return false;
                return true;
            });
        }

        if (minVolunteers || maxVolunteers) {
            allOrgs = allOrgs.filter((org: any) => {
                const volunteers = org.profile?.numberOfVolunteers;
                if (!volunteers) return false;
                const volunteerNum = typeof volunteers === 'string' ? parseInt(volunteers) : volunteers;
                if (minVolunteers && volunteerNum < parseInt(minVolunteers as string)) return false;
                if (maxVolunteers && volunteerNum > parseInt(maxVolunteers as string)) return false;
                return true;
            });
        }

        if (lookingForPartnersFromCPs) {
            allOrgs = allOrgs.filter((org: any) =>
                org.fields?.lookingForPartnersFromCPs?.includes(lookingForPartnersFromCPs as string)
            );
        }

        if (lookingForPartnersInThematicAreas) {
            allOrgs = allOrgs.filter((org: any) =>
                org.fields?.lookingForPartnersInThematicAreas?.includes(lookingForPartnersInThematicAreas as string)
            );
        }

        // Project filters (client-side; filter organisations that have at least one project matching)
        if (projectStatus) {
            allOrgs = allOrgs.filter((org: any) =>
                org.projects?.some((p: any) => (p.projectStatus || p.status) === projectStatus)
            );
        }
        if (fundingSource) {
            allOrgs = allOrgs.filter((org: any) =>
                org.projects?.some((p: any) => p.fundingSource === fundingSource)
            );
        }
        if (budgetVisibility) {
            allOrgs = allOrgs.filter((org: any) =>
                org.projects?.some((p: any) => p.budgetVisibility === budgetVisibility)
            );
        }
        if (visibility) {
            allOrgs = allOrgs.filter((org: any) =>
                org.projects?.some((p: any) => p.visibility === visibility)
            );
        }

        // Search functionality
        if (search) {
            const searchTerm = (search as string).toLowerCase();
            allOrgs = allOrgs.filter((org: any) =>
                org.name?.toLowerCase()?.includes(searchTerm) ||
                org.nameLocal?.toLowerCase().includes(searchTerm) ||
                org.fields?.missionFields?.some((field: string) => field.toLowerCase().includes(searchTerm)) ||
                org.fields?.keywords?.some((keyword: string) => keyword.toLowerCase().includes(searchTerm)) ||
                org.contact?.personName?.toLowerCase().includes(searchTerm) ||
                org.profile?.city?.toLowerCase().includes(searchTerm) ||
                org.profile?.contractingParty?.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by byCall (preferred) or hasActiveCall (legacy support)
        const callFilter = byCall || hasActiveCall;
        if (callFilter !== undefined && callFilter !== null && callFilter !== "" && callFilter !== "all") {
            let hasActiveCallBool: boolean;
            
            // Handle new byCall parameter values
            if (callFilter === "hasCallsOrProjects") {
                hasActiveCallBool = true;
            } else if (callFilter === "noCallsOrProjects") {
                hasActiveCallBool = false;
            } else {
                // Legacy support for hasActiveCall parameter
                const callFilterStr = String(callFilter);
                hasActiveCallBool = callFilterStr === "true" || callFilterStr === "1";
            }
            
            allOrgs = allOrgs.filter((org: any) => {
                // Helper function to check if a call/project is active
                const isActive = (item: any): boolean => {
                    if (item.status === "active") return true;
                    if (item.status === "closed" || item.status === "draft") return false;
                    
                    // Check deadline if status is not explicitly set
                    if (item.deadline) {
                        let deadlineDate: Date;
                        if (item.deadline instanceof Date) {
                            deadlineDate = item.deadline;
                        } else if (item.deadline._seconds) {
                            deadlineDate = new Date(item.deadline._seconds * 1000);
                        } else if (typeof item.deadline === "string") {
                            deadlineDate = new Date(item.deadline);
                        } else {
                            return false;
                        }
                        return deadlineDate > new Date();
                    }
                    return false;
                };
                
                // Check if organisation has active calls
                const calls = org.calls || [];
                const hasActiveCall = calls.some((call: any) => isActive(call));
                
                // Check if organisation has active projects
                const projects = org.projects || [];
                const hasActiveProject = projects.some((project: any) => isActive(project));
                
                // Organisation has active call/project if either has active call or active project
                const hasActive = hasActiveCall || hasActiveProject;
                
                return hasActive === hasActiveCallBool;
            });
        }

        const total = allOrgs.length;
        const totalPages = Math.ceil(total / limitNum);
        const startIdx = (pageNum - 1) * limitNum;
        const pagedOrgs = allOrgs.slice(startIdx, startIdx + limitNum);

        // Add favorite status if user is authenticated
        let enrichedOrgs = pagedOrgs;
        if (req.user?.organisationId) {
            try {
                console.log(`[DEBUG] /browse - Checking favorites for organisationId: ${req.user.organisationId}`);
                const currentOrgDoc = await organisationsCollection.doc(req.user.organisationId).get();
                if (currentOrgDoc.exists) {
                    const currentOrgData = currentOrgDoc.data();
                    const favoriteIds = (currentOrgData?.favorites || []) as string[];
                    const favoriteSet = new Set(favoriteIds);
                    
                    console.log(`[DEBUG] /browse - Found ${favoriteIds.length} favorites for authenticated user`);
                    
                    enrichedOrgs = pagedOrgs.map((org: any) => ({
                        ...org,
                        isFavorite: favoriteSet.has(org.id)
                    }));
                } else {
                    console.log(`[DEBUG] /browse - Organisation document not found for ID: ${req.user.organisationId}`);
                    // If org not found, set isFavorite to false for all
                    enrichedOrgs = pagedOrgs.map((org: any) => ({
                        ...org,
                        isFavorite: false
                    }));
                }
            } catch (error) {
                console.error("Error checking favorites:", error);
                // Continue without favorite status if there's an error
                enrichedOrgs = pagedOrgs.map((org: any) => ({
                    ...org,
                    isFavorite: false
                }));
            }
        } else {
            // If not authenticated, set isFavorite to false for all
            console.log(`[DEBUG] /browse - No authentication token provided, returning organisations without favorite status`);
            enrichedOrgs = pagedOrgs.map((org: any) => ({
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
    } catch (error: any) {
        console.error("[ERROR] Browse organisations error:", error);
        return res.status(500).json({
            success: false,
            error: process.env.NODE_ENV === "production" ? "Failed to browse organisations" : error.message,
        });
    }
});

// GET /organisation/all (get all organizations for messaging)
// This route MUST come before /:id to avoid conflicts
router.get("/all", authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { search, limit = "50" } = req.query;
        const limitNum = parseInt(limit as string) || 50;

        // Get all approved organizations
        let query = organisationsCollection.where('status', '==', 'approved');
        const snapshot = await query.limit(limitNum * 2).get(); // Get more for client-side filtering

        let organisations = snapshot.docs.map((doc: any) => {
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

        // Apply search filter client-side (more flexible than Firestore text search)
        if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            organisations = organisations.filter((org: any) =>
                org.name?.toLowerCase().includes(searchLower) ||
                org.description?.toLowerCase().includes(searchLower) ||
                org.city?.toLowerCase().includes(searchLower) ||
                org.country?.toLowerCase().includes(searchLower) ||
                org.organisationType?.toLowerCase().includes(searchLower)
            );
        }

        // Apply limit after filtering
        organisations = organisations.slice(0, limitNum);

        return res.json({
            success: true,
            data: { organisations }
        });

    } catch (error: any) {
        console.error("Get all organisations error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch organisations"
        });
    }
});

// GET /organisation/:id
router.get("/:id", async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { id } = req.params;

        const orgDoc = await organisationsCollection.doc(id).get();

        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const orgData = orgDoc.data();
        
        // Return full organisation data using groupOrganisationData
        const organisationData = groupOrganisationData(orgData, orgDoc.id);

        return res.json({
            success: true,
            data: organisationData,
        });
    } catch (error: any) {
        console.error("Get organisation error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get organisation",
        });
    }
});

// GET /organisation/me/profile (authenticated user's own profile)
router.get("/me/profile", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }
        const orgDoc = await organisationsCollection.doc(req.user.organisationId).get();
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
    } catch (error: any) {
        console.error("Get profile error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get profile",
        });
    }
});

// PUT /organisation/:id/edit (resubmit after decline)
router.put("/:id/edit", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { id } = req.params;

        // Verify user owns this organisation
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

        const updateData: Partial<RegisterStep2Request> = value;

        // Get current organisation data
        const orgDoc = await organisationsCollection.doc(id).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const orgData = orgDoc.data() as Organisation;

        // Only allow editing if status is declined
        if (orgData.status !== "declined") {
            return res.status(400).json({
                success: false,
                error: "Can only edit declined profiles",
            });
        }

        // Update organisation data
        const updatedData = {
            ...updateData,
            status: "pending" as const,
            updatedAt: new Date(),
            feedback: undefined, // Clear previous feedback
            adminId: undefined, // Clear previous admin review
            reviewedAt: undefined, // Clear previous review date
        };

        await organisationsCollection.doc(id).update(updatedData);

        return res.json({
            success: true,
            data: {
                message: "Profile updated and resubmitted for review",
            },
        });
    } catch (error: any) {
        console.error("Update organisation error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to update organisation",
        });
    }
});

// POST /organisation/complete-profile (complete profile submission)
router.post("/complete-profile", authenticateToken, requireOrganisationForProfile, async (req: Request, res: Response<ApiResponse>) => {
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

        // Convert string numbers to actual numbers, but keep ranges as strings
        const convertedValue = {
            ...value,
            numberOfStaff: value.numberOfStaff && typeof value.numberOfStaff === 'string' && !value.numberOfStaff.includes('-') ? parseInt(value.numberOfStaff, 10) : value.numberOfStaff,
            numberOfVolunteers: value.numberOfVolunteers && typeof value.numberOfVolunteers === 'string' && !value.numberOfVolunteers.includes('-') ? parseInt(value.numberOfVolunteers, 10) : value.numberOfVolunteers,
            yearOfEstablishment: typeof value.yearOfEstablishment === 'string' ? parseInt(value.yearOfEstablishment, 10) : value.yearOfEstablishment,
            wbfCallsApplied: value.wbfCallsApplied ? value.wbfCallsApplied.map((call: any) => ({
                ...call,
                year: typeof call.year === 'string' ? parseInt(call.year, 10) : call.year
            })) : null
        };

        // Remove undefined values - Firestore doesn't accept undefined
        const cleanProfileData: any = {};
        Object.keys(convertedValue).forEach((key) => {
            if (convertedValue[key] !== undefined) {
                cleanProfileData[key] = convertedValue[key];
            }
        });

        const profileData = cleanProfileData;

        // Get current organisation data
        const orgDoc = await organisationsCollection.doc(req.user.organisationId).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const orgData = orgDoc.data() as Organisation;

        // Build update object selectively - only include fields that should be updated
        // Don't spread orgData as it may contain Firestore Timestamps and other metadata
        const updatedData: any = {
            // Preserve system fields that shouldn't change (don't include createdAt as it's a Firestore Timestamp)
            name: orgData.name, // Preserve existing name from registration
            
            // Update profile fields from profileData
            nameLocal: profileData.nameLocal,
            contractingParty: profileData.contractingParty,
            city: profileData.city,
            type: profileData.type,
            yearOfEstablishment: profileData.yearOfEstablishment,
            
            // Update optional fields only if provided (not null)
            ...(profileData.postalAddress !== null && profileData.postalAddress !== undefined && { postalAddress: profileData.postalAddress }),
            ...(profileData.registrationNumber !== null && profileData.registrationNumber !== undefined && { registrationNumber: profileData.registrationNumber }),
            ...(profileData.numberOfStaff !== null && profileData.numberOfStaff !== undefined && { numberOfStaff: profileData.numberOfStaff }),
            ...(profileData.numberOfVolunteers !== null && profileData.numberOfVolunteers !== undefined && { numberOfVolunteers: profileData.numberOfVolunteers }),
            ...(profileData.missionFields !== null && profileData.missionFields !== undefined && { missionFields: profileData.missionFields }),
            ...(profileData.website !== null && profileData.website !== undefined && { website: profileData.website }),
            ...(profileData.socialMediaProfiles !== null && profileData.socialMediaProfiles !== undefined && { socialMediaProfiles: profileData.socialMediaProfiles }),
            
            // Contact information
            contactPersonName: profileData.contactPersonName,
            contactEmail: profileData.contactEmail,
            ...(profileData.contactPersonPosition !== null && profileData.contactPersonPosition !== undefined && { contactPersonPosition: profileData.contactPersonPosition }),
            ...(profileData.contactPhone !== null && profileData.contactPhone !== undefined && { contactPhone: profileData.contactPhone }),
            
            // Project history (optional)
            ...(profileData.wbfCallsApplied !== null && profileData.wbfCallsApplied !== undefined && { wbfCallsApplied: profileData.wbfCallsApplied }),
            ...(profileData.roleInPastApplications !== null && profileData.roleInPastApplications !== undefined && { roleInPastApplications: profileData.roleInPastApplications }),
            ...(profileData.projects !== null && profileData.projects !== undefined && { projects: profileData.projects }),
            ...(profileData.projectThematicAreas !== null && profileData.projectThematicAreas !== undefined && { projectThematicAreas: profileData.projectThematicAreas }),
            ...(profileData.geographicalCoverage !== null && profileData.geographicalCoverage !== undefined && { geographicalCoverage: profileData.geographicalCoverage }),
            
            // Partnership interests (optional)
            ...(profileData.lookingForPartnersInThematicAreas !== null && profileData.lookingForPartnersInThematicAreas !== undefined && { lookingForPartnersInThematicAreas: profileData.lookingForPartnersInThematicAreas }),
            ...(profileData.lookingForPartnersFromCPs !== null && profileData.lookingForPartnersFromCPs !== undefined && { lookingForPartnersFromCPs: profileData.lookingForPartnersFromCPs }),
            ...(profileData.preferredRole !== null && profileData.preferredRole !== undefined && { preferredRole: profileData.preferredRole }),
            ...(profileData.expertiseOffered !== null && profileData.expertiseOffered !== undefined && { expertiseOffered: profileData.expertiseOffered }),
            ...(profileData.expertiseSought !== null && profileData.expertiseSought !== undefined && { expertiseSought: profileData.expertiseSought }),
            
            // Additional information (optional)
            ...(profileData.keywords !== null && profileData.keywords !== undefined && { keywords: profileData.keywords }),
            ...(profileData.availableResources !== null && profileData.availableResources !== undefined && { availableResources: profileData.availableResources }),
            ...(profileData.referenceProjects !== null && profileData.referenceProjects !== undefined && { referenceProjects: profileData.referenceProjects }),
            ...(profileData.successStories !== null && profileData.successStories !== undefined && { successStories: profileData.successStories }),
            ...(profileData.partnershipNotes !== null && profileData.partnershipNotes !== undefined && { partnershipNotes: profileData.partnershipNotes }),
            
            // Images - only update if provided (not empty string)
            logo: (profileData.logoUrl && profileData.logoUrl.trim() !== '') ? profileData.logoUrl : (orgData.logo || ''),
            cover: (profileData.coverUrl && profileData.coverUrl.trim() !== '') ? profileData.coverUrl : (orgData.cover || ''),
            
            // Status and timestamps
            status: "approved" as const, // Auto-approve for now
            updatedAt: new Date(),
            profileCompleted: true,
            profileCompletedAt: new Date(),
            approvedAt: new Date(), // Add approval timestamp
        };

        // Remove undefined values - Firestore doesn't accept undefined
        const cleanUpdateData: any = {};
        Object.keys(updatedData).forEach((key) => {
            if (updatedData[key] !== undefined) {
                cleanUpdateData[key] = updatedData[key];
            }
        });

        await organisationsCollection.doc(req.user.organisationId).update(cleanUpdateData);

        return res.json({
            success: true,
            data: {
                message: "Profile completed successfully and approved! You can now access the platform.",
                organisationId: req.user.organisationId,
            },
        });
    } catch (error: any) {
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

// GET /organisation/opportunities/all (get all organizations' opportunities)
router.get("/opportunities/all", async (req: Request, res: Response<ApiResponse>) => {
    try {
        const {
            type,
            page = "1",
            limit = "12",
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
        const limitNum = parseInt(limit as string) || 12;
        const includeFinishedBool = includeFinished === "true";

        // Get organizations (filter by organisationId if provided; otherwise only approved)
        let orgsSnapshot;
        if (organisationId && typeof organisationId === 'string') {
            const orgDoc = await organisationsCollection.doc(organisationId).get();
            const dataFn = (orgDoc as any).data;
            const orgData = typeof dataFn === 'function' ? dataFn() : undefined;
            const isApproved = orgData?.status === "approved";
            orgsSnapshot = orgDoc.exists && isApproved ? { docs: [orgDoc] } : { docs: [] };
        } else {
            orgsSnapshot = await organisationsCollection.where("status", "==", "approved").get();
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

        // Filter by budget range (overlap: opportunity range overlaps user's range)
        if (budgetMin || budgetMax) {
            const userMin = budgetMin ? parseInt(budgetMin as string) : 0;
            const userMax = budgetMax ? parseInt(budgetMax as string) : Infinity;
            filteredOpportunities = filteredOpportunities.filter(op => {
                if (!op.budget || op.budget.min == null || op.budget.max == null) return false;
                return op.budget.min <= userMax && op.budget.max >= userMin;
            });
        }

        // Filter by deadline (exclude finished if needed)
        if (!includeFinishedBool) {
            const now = new Date();
            filteredOpportunities = filteredOpportunities.filter(op => {
                if (!op.deadline) return true;
                const deadline = op.deadline._seconds ?
                    new Date(op.deadline._seconds * 1000) :
                    new Date(op.deadline);
                return deadline >= now;
            });
        }

        // Sort opportunities
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

        // Apply pagination
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
    } catch (error: any) {
        console.error("Get all opportunities error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch opportunities",
        });
    }
});


// GET /organisation/me/opportunities (get organization's calls and projects)
router.get("/me/opportunities", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        const { type, page = "1", limit = "10" } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;

        // Get the organization document
        const orgDoc = await organisationsCollection.doc(req.user.organisationId).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const orgData = orgDoc.data();
        let opportunities: any[] = [];

        // Get calls and projects from the embedded arrays
        const calls = orgData?.calls || [];
        const projects = orgData?.projects || [];

        // Filter by type if specified
        if (type === 'call') {
            opportunities = calls;
        } else if (type === 'project') {
            opportunities = projects;
        } else {
            // Return both calls and projects, marked with their type
            opportunities = [
                ...calls.map((call: any) => ({ ...call, type: 'call' })),
                ...projects.map((project: any) => ({ ...project, type: 'project' }))
            ];
        }

        // Sort by deadline (closest first) or createdAt if no deadline
        opportunities.sort((a: any, b: any) => {
            const aDate = a.deadline?._seconds ? new Date(a.deadline._seconds * 1000) :
                a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(0);
            const bDate = b.deadline?._seconds ? new Date(b.deadline._seconds * 1000) :
                b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(0);
            return aDate.getTime() - bDate.getTime();
        });

        // Apply pagination
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
    } catch (error: any) {
        console.error("Get organization opportunities error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch opportunities",
        });
    }
});

// POST /organisation/fix-image-urls (temporary endpoint to fix existing images)
router.post("/fix-image-urls", authenticateToken, requireOrganisationForProfile, async (req: Request, res: Response<ApiResponse>) => {
    return res.status(503).json({
        success: false,
        error: "Image fix service is unavailable (Firebase Storage removed)."
    });
});

// POST /organisation/favorites/:id - Add organisation to favorites
router.post('/favorites/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
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

        // Get current organisation
        await organisationsCollection.doc(organisationId).update({
            favorites: FieldValue.arrayUnion(targetOrganisationId),
            updatedAt: Timestamp.now()
        });

        return res.json({
            success: true,
            data: { message: "Organisation added to favorites" }
        });
    } catch (error: any) {
        console.error("Error adding favorite:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to add favorite"
        });
    }
});

// DELETE /organisation/favorites/:id - Remove organisation from favorites
router.delete('/favorites/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
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

        // Remove from favorites array
        await organisationsCollection.doc(organisationId).update({
            favorites: FieldValue.arrayRemove(targetOrganisationId),
            updatedAt: Timestamp.now()
        });

        return res.json({
            success: true,
            data: { message: "Organisation removed from favorites" }
        });
    } catch (error: any) {
        console.error("Error removing favorite:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to remove favorite"
        });
    }
});

// GET /organisation/favorites - Get user's favorite organisations
router.get('/favorites', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
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
        
        // Get current organisation's favorites
        const orgData = organisationDoc.data()!;
        const favoriteIds = orgData.favorites || [];
        console.log(`[DEBUG] /favorites - Found ${favoriteIds.length} favorite IDs:`, favoriteIds);

        if (favoriteIds.length === 0) {
            return res.json({
                success: true,
                data: { organisations: [] }
            });
        }

        // Fetch favorite organisations details
        const favoriteOrgs = [];
        for (const favId of favoriteIds) {
            const favDoc = await organisationsCollection.doc(favId).get();
            if (favDoc.exists) {
                const favData = favDoc.data()!;
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
    } catch (error: any) {
        console.error("Error getting favorites:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get favorites"
        });
    }
});

export default router; 