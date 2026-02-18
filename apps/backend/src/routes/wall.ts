import { Router, Request, Response, NextFunction } from "express";
import Joi from "joi";
import multer from "multer";
import { organisationsCollection } from "../services/mongodb-wrapper";
import { authenticateToken, requireOrganisation } from "../middleware/auth";
import { ApiResponse } from "../types";
import { uploadToS3 } from "../services/storage";

const router = Router();

// Configure multer for image uploads
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

// Validation schemas
const createPostSchema = Joi.object({
    content: Joi.string().min(1).max(2000).required(),
    type: Joi.string().valid('status', 'announcement', 'project_update', 'general', 'partnership').required(),
    attachments: Joi.array().items(Joi.string()).optional(),
    imageUrl: Joi.string().uri().optional(),
});

const addReactionSchema = Joi.object({
    type: Joi.string().valid('like', 'fire', 'great', 'wow', 'love', 'thumbs_up').required(),
});

const addCommentSchema = Joi.object({
    content: Joi.string().min(1).max(500).required(),
});

// Helper function to generate unique IDs
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// POST /wall/upload-image - Upload image for wall post
// @ts-ignore
router.post("/upload-image", authenticateToken, requireOrganisation, upload.single('image'), async (req: Request, res: Response<ApiResponse>) => {
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
                error: "Image file is required",
            });
        }

        const { url, key } = await uploadToS3({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            folder: `organisations/${req.user.organisationId}/wall`,
        });

        return res.json({
            success: true,
            data: {
                url,
                path: key,
            },
        });
    } catch (error) {
        console.error("Upload wall image error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to upload wall image",
        });
    }
});

// Helper function to get organisation info
const getOrganisationInfo = async (organisationId: string) => {
    try {
        const orgDoc = await organisationsCollection.doc(organisationId).get();
        if (!orgDoc.exists) return null;

        const orgData = orgDoc.data();
        return {
            id: organisationId,
            name: orgData?.name || 'Unknown Organisation',
            logo: orgData?.logo || orgData?.images?.logo || '',
        };
    } catch (error) {
        console.error('Error getting organisation info:', error);
        return null;
    }
};

// GET /wall/posts - Get all wall posts with pagination
router.get("/posts", async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { page = "1", limit = "10" } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;

        // Get all organisations with wall posts
        const orgsSnapshot = await organisationsCollection.get();
        let allPosts: any[] = [];

        // Collect wall posts from all organisations
        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            const wallPosts = orgData.wallPosts || [];

            const orgInfo = {
                id: orgDoc.id,
                name: orgData.name || 'Unknown Organisation',
                logo: orgData.logo || orgData.images?.logo || '',
            };

            // Add organisation info to each post
            const postsWithOrgInfo = wallPosts.map((post: any) => ({
                ...post,
                organisationId: orgDoc.id,
                organisationName: orgInfo.name,
                organisationLogo: orgInfo.logo,
            }));

            allPosts = [...allPosts, ...postsWithOrgInfo];
        }

        // Sort posts by creation date (newest first)
        allPosts.sort((a, b) => {
            const aDate = a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(a.createdAt || 0);
            const bDate = b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(b.createdAt || 0);
            return bDate.getTime() - aDate.getTime();
        });

        // Apply pagination
        const total = allPosts.length;
        const totalPages = Math.ceil(total / limitNum);
        const startIdx = (pageNum - 1) * limitNum;
        const paginatedPosts = allPosts.slice(startIdx, startIdx + limitNum);

        return res.json({
            success: true,
            data: {
                posts: paginatedPosts,
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
        console.error("Get wall posts error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch wall posts",
        });
    }
});

// POST /wall/posts - Create a new wall post
router.post("/posts", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        const { error, value } = createPostSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }

        const organisationId = req.user.organisationId;
        const orgInfo = await getOrganisationInfo(organisationId);

        if (!orgInfo) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        // Create new post
        const newPost = {
            id: generateId(),
            organisationId,
            organisationName: orgInfo.name,
            organisationLogo: orgInfo.logo,
            content: value.content,
            type: value.type,
            attachments: value.attachments || [],
            imageUrl: value.imageUrl || null,
            reactions: [],
            comments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Get current organisation data
        const orgDoc = await organisationsCollection.doc(organisationId).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const orgData = orgDoc.data();
        const wallPosts = orgData?.wallPosts || [];

        // Add new post to the beginning of the array
        const updatedWallPosts = [newPost, ...wallPosts];

        // Update organisation document
        await organisationsCollection.doc(organisationId).update({
            wallPosts: updatedWallPosts,
            updatedAt: new Date(),
        });

        return res.json({
            success: true,
            data: newPost,
        });
    } catch (error: any) {
        console.error("Create wall post error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to create wall post",
        });
    }
});

// POST /wall/posts/:postId/reactions - Add or update reaction to a post
router.post("/posts/:postId/reactions", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        const { postId } = req.params;
        const { error, value } = addReactionSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }

        const organisationId = req.user.organisationId;
        const orgInfo = await getOrganisationInfo(organisationId);

        if (!orgInfo) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        // Find the organisation that owns this post
        const orgsSnapshot = await organisationsCollection.get();
        let targetOrgId: string | null = null;
        let targetOrgData: any = null;

        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            const wallPosts = orgData.wallPosts || [];
            const post = wallPosts.find((p: any) => p.id === postId);

            if (post) {
                targetOrgId = orgDoc.id;
                targetOrgData = orgData;
                break;
            }
        }

        if (!targetOrgId || !targetOrgData) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }

        const wallPosts = targetOrgData.wallPosts || [];
        const postIndex = wallPosts.findIndex((p: any) => p.id === postId);

        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }

        const post = wallPosts[postIndex];

        // Remove existing reaction from this organisation if any
        post.reactions = post.reactions.filter((r: any) => r.organisationId !== organisationId);

        // Add new reaction
        const newReaction = {
            id: generateId(),
            organisationId,
            organisationName: orgInfo.name,
            organisationLogo: orgInfo.logo,
            type: value.type,
            createdAt: new Date(),
        };

        post.reactions.push(newReaction);
        post.updatedAt = new Date();

        // Update the organisation document
        await organisationsCollection.doc(targetOrgId).update({
            wallPosts,
            updatedAt: new Date(),
        });

        return res.json({
            success: true,
            data: newReaction,
        });
    } catch (error: any) {
        console.error("Add reaction error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to add reaction",
        });
    }
});

// DELETE /wall/posts/:postId/reactions - Remove reaction from a post
router.delete("/posts/:postId/reactions", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        const { postId } = req.params;
        const organisationId = req.user.organisationId;

        // Find the organisation that owns this post
        const orgsSnapshot = await organisationsCollection.get();
        let targetOrgId: string | null = null;
        let targetOrgData: any = null;

        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            const wallPosts = orgData.wallPosts || [];
            const post = wallPosts.find((p: any) => p.id === postId);

            if (post) {
                targetOrgId = orgDoc.id;
                targetOrgData = orgData;
                break;
            }
        }

        if (!targetOrgId || !targetOrgData) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }

        const wallPosts = targetOrgData.wallPosts || [];
        const postIndex = wallPosts.findIndex((p: any) => p.id === postId);

        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }

        const post = wallPosts[postIndex];

        // Remove reaction from this organisation
        const initialLength = post.reactions.length;
        post.reactions = post.reactions.filter((r: any) => r.organisationId !== organisationId);

        // Only update if a reaction was actually removed
        if (post.reactions.length < initialLength) {
            post.updatedAt = new Date();

            // Update the organisation document
            await organisationsCollection.doc(targetOrgId).update({
                wallPosts,
                updatedAt: new Date(),
            });
        }

        return res.json({
            success: true,
            data: { message: "Reaction removed successfully" },
        });
    } catch (error: any) {
        console.error("Remove reaction error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to remove reaction",
        });
    }
});

// POST /wall/posts/:postId/comments - Add comment to a post
router.post("/posts/:postId/comments", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        const { postId } = req.params;
        const { error, value } = addCommentSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }

        const organisationId = req.user.organisationId;
        const orgInfo = await getOrganisationInfo(organisationId);

        if (!orgInfo) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        // Find the organisation that owns this post
        const orgsSnapshot = await organisationsCollection.get();
        let targetOrgId: string | null = null;
        let targetOrgData: any = null;

        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            const wallPosts = orgData.wallPosts || [];
            const post = wallPosts.find((p: any) => p.id === postId);

            if (post) {
                targetOrgId = orgDoc.id;
                targetOrgData = orgData;
                break;
            }
        }

        if (!targetOrgId || !targetOrgData) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }

        const wallPosts = targetOrgData.wallPosts || [];
        const postIndex = wallPosts.findIndex((p: any) => p.id === postId);

        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }

        const post = wallPosts[postIndex];

        // Add new comment
        const newComment = {
            id: generateId(),
            organisationId,
            organisationName: orgInfo.name,
            organisationLogo: orgInfo.logo,
            content: value.content,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        post.comments.push(newComment);
        post.updatedAt = new Date();

        // Update the organisation document
        await organisationsCollection.doc(targetOrgId).update({
            wallPosts,
            updatedAt: new Date(),
        });

        return res.json({
            success: true,
            data: newComment,
        });
    } catch (error: any) {
        console.error("Add comment error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to add comment",
        });
    }
});

// DELETE /wall/posts/:id - Delete a wall post
router.delete("/posts/:id", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { id } = req.params;
        const organisationId = req.user?.organisationId;

        if (!organisationId) {
            return res.status(401).json({
                success: false,
                error: "Organisation ID not found",
            });
        }

        // Get the organisation document
        const orgDoc = await organisationsCollection.doc(organisationId).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }

        const orgData = orgDoc.data();
        if (!orgData?.wallPosts) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }

        // Find the post
        const postIndex = orgData.wallPosts.findIndex((post: any) => post.id === id);
        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }

        const post = orgData.wallPosts[postIndex];

        // Check if the current organisation is the creator of the post
        if (post.organisationId !== organisationId) {
            return res.status(403).json({
                success: false,
                error: "You can only delete your own posts",
            });
        }

        // Remove the post from the array
        orgData.wallPosts.splice(postIndex, 1);

        // Update the organisation document
        await organisationsCollection.doc(organisationId).update({
            wallPosts: orgData.wallPosts,
        });

        return res.json({
            success: true,
            data: { postId: id },
            message: "Post deleted successfully",
        });
    } catch (error) {
        console.error("Delete post error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to delete post",
        });
    }
});

export default router;
