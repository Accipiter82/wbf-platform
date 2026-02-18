"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const multer_1 = __importDefault(require("multer"));
const mongodb_wrapper_1 = require("../services/mongodb-wrapper");
const auth_1 = require("../middleware/auth");
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
const createPostSchema = joi_1.default.object({
    content: joi_1.default.string().min(1).max(2000).required(),
    type: joi_1.default.string().valid('status', 'announcement', 'project_update', 'general', 'partnership').required(),
    attachments: joi_1.default.array().items(joi_1.default.string()).optional(),
    imageUrl: joi_1.default.string().uri().optional(),
});
const addReactionSchema = joi_1.default.object({
    type: joi_1.default.string().valid('like', 'fire', 'great', 'wow', 'love', 'thumbs_up').required(),
});
const addCommentSchema = joi_1.default.object({
    content: joi_1.default.string().min(1).max(500).required(),
});
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
router.post("/upload-image", auth_1.authenticateToken, auth_1.requireOrganisation, upload.single('image'), async (req, res) => {
    return res.status(503).json({
        success: false,
        error: "File upload service is temporarily unavailable (Firebase Storage removed)."
    });
});
const getOrganisationInfo = async (organisationId) => {
    try {
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(organisationId).get();
        if (!orgDoc.exists)
            return null;
        const orgData = orgDoc.data();
        return {
            id: organisationId,
            name: orgData?.name || 'Unknown Organisation',
            logo: orgData?.logo || orgData?.images?.logo || '',
        };
    }
    catch (error) {
        console.error('Error getting organisation info:', error);
        return null;
    }
};
router.get("/posts", async (req, res) => {
    try {
        const { page = "1", limit = "10" } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const orgsSnapshot = await mongodb_wrapper_1.organisationsCollection.get();
        let allPosts = [];
        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            const wallPosts = orgData.wallPosts || [];
            const orgInfo = {
                id: orgDoc.id,
                name: orgData.name || 'Unknown Organisation',
                logo: orgData.logo || orgData.images?.logo || '',
            };
            const postsWithOrgInfo = wallPosts.map((post) => ({
                ...post,
                organisationId: orgDoc.id,
                organisationName: orgInfo.name,
                organisationLogo: orgInfo.logo,
            }));
            allPosts = [...allPosts, ...postsWithOrgInfo];
        }
        allPosts.sort((a, b) => {
            const aDate = a.createdAt?._seconds ? new Date(a.createdAt._seconds * 1000) : new Date(a.createdAt || 0);
            const bDate = b.createdAt?._seconds ? new Date(b.createdAt._seconds * 1000) : new Date(b.createdAt || 0);
            return bDate.getTime() - aDate.getTime();
        });
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
    }
    catch (error) {
        console.error("Get wall posts error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch wall posts",
        });
    }
});
router.post("/posts", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
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
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(organisationId).get();
        if (!orgDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
        }
        const orgData = orgDoc.data();
        const wallPosts = orgData?.wallPosts || [];
        const updatedWallPosts = [newPost, ...wallPosts];
        await mongodb_wrapper_1.organisationsCollection.doc(organisationId).update({
            wallPosts: updatedWallPosts,
            updatedAt: new Date(),
        });
        return res.json({
            success: true,
            data: newPost,
        });
    }
    catch (error) {
        console.error("Create wall post error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to create wall post",
        });
    }
});
router.post("/posts/:postId/reactions", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
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
        const orgsSnapshot = await mongodb_wrapper_1.organisationsCollection.get();
        let targetOrgId = null;
        let targetOrgData = null;
        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            const wallPosts = orgData.wallPosts || [];
            const post = wallPosts.find((p) => p.id === postId);
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
        const postIndex = wallPosts.findIndex((p) => p.id === postId);
        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }
        const post = wallPosts[postIndex];
        post.reactions = post.reactions.filter((r) => r.organisationId !== organisationId);
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
        await mongodb_wrapper_1.organisationsCollection.doc(targetOrgId).update({
            wallPosts,
            updatedAt: new Date(),
        });
        return res.json({
            success: true,
            data: newReaction,
        });
    }
    catch (error) {
        console.error("Add reaction error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to add reaction",
        });
    }
});
router.delete("/posts/:postId/reactions", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        if (!req.user?.organisationId) {
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found",
            });
        }
        const { postId } = req.params;
        const organisationId = req.user.organisationId;
        const orgsSnapshot = await mongodb_wrapper_1.organisationsCollection.get();
        let targetOrgId = null;
        let targetOrgData = null;
        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            const wallPosts = orgData.wallPosts || [];
            const post = wallPosts.find((p) => p.id === postId);
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
        const postIndex = wallPosts.findIndex((p) => p.id === postId);
        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }
        const post = wallPosts[postIndex];
        const initialLength = post.reactions.length;
        post.reactions = post.reactions.filter((r) => r.organisationId !== organisationId);
        if (post.reactions.length < initialLength) {
            post.updatedAt = new Date();
            await mongodb_wrapper_1.organisationsCollection.doc(targetOrgId).update({
                wallPosts,
                updatedAt: new Date(),
            });
        }
        return res.json({
            success: true,
            data: { message: "Reaction removed successfully" },
        });
    }
    catch (error) {
        console.error("Remove reaction error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to remove reaction",
        });
    }
});
router.post("/posts/:postId/comments", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
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
        const orgsSnapshot = await mongodb_wrapper_1.organisationsCollection.get();
        let targetOrgId = null;
        let targetOrgData = null;
        for (const orgDoc of orgsSnapshot.docs) {
            const orgData = orgDoc.data();
            const wallPosts = orgData.wallPosts || [];
            const post = wallPosts.find((p) => p.id === postId);
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
        const postIndex = wallPosts.findIndex((p) => p.id === postId);
        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }
        const post = wallPosts[postIndex];
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
        await mongodb_wrapper_1.organisationsCollection.doc(targetOrgId).update({
            wallPosts,
            updatedAt: new Date(),
        });
        return res.json({
            success: true,
            data: newComment,
        });
    }
    catch (error) {
        console.error("Add comment error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to add comment",
        });
    }
});
router.delete("/posts/:id", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user?.organisationId;
        if (!organisationId) {
            return res.status(401).json({
                success: false,
                error: "Organisation ID not found",
            });
        }
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(organisationId).get();
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
        const postIndex = orgData.wallPosts.findIndex((post) => post.id === id);
        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Post not found",
            });
        }
        const post = orgData.wallPosts[postIndex];
        if (post.organisationId !== organisationId) {
            return res.status(403).json({
                success: false,
                error: "You can only delete your own posts",
            });
        }
        orgData.wallPosts.splice(postIndex, 1);
        await mongodb_wrapper_1.organisationsCollection.doc(organisationId).update({
            wallPosts: orgData.wallPosts,
        });
        return res.json({
            success: true,
            data: { postId: id },
            message: "Post deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete post error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to delete post",
        });
    }
});
exports.default = router;
//# sourceMappingURL=wall.js.map