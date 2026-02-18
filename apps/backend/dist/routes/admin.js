"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const mongodb_wrapper_1 = require("../services/mongodb-wrapper");
const auth_1 = require("../middleware/auth");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
const reviewSchema = joi_1.default.object({
    action: joi_1.default.string().valid("approve", "decline").required(),
    feedback: joi_1.default.string().when("action", {
        is: "decline",
        then: joi_1.default.string().min(10).max(1000).required(),
        otherwise: joi_1.default.string().optional(),
    }),
});
router.get("/pending", auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { page = "1", limit = "10" } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;
        const snapshot = await mongodb_wrapper_1.organisationsCollection
            .where("status", "==", "pending")
            .orderBy("createdAt", "desc")
            .limit(limitNum)
            .get();
        const organisations = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                nameLocal: data.nameLocal,
                city: data.city,
                website: data.website,
                logo: data.logo,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            };
        });
        const totalSnapshot = await mongodb_wrapper_1.organisationsCollection
            .where("status", "==", "pending")
            .get();
        res.json({
            success: true,
            data: {
                organisations,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalSnapshot.size,
                    totalPages: Math.ceil(totalSnapshot.size / limitNum),
                },
            },
        });
        return;
    }
    catch (error) {
        console.error("Get pending organisations error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get pending organisations",
        });
        return;
    }
});
router.get("/organisations", auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status, page = "1", limit = "10" } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;
        let query = mongodb_wrapper_1.organisationsCollection.orderBy("createdAt", "desc");
        if (status && ["draft", "pending", "approved", "declined"].includes(status)) {
            query = query.where("status", "==", status);
        }
        const snapshot = await query.limit(limitNum).get();
        const organisations = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                nameLocal: data.nameLocal,
                city: data.city,
                website: data.website,
                logo: data.logo,
                status: data.status,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                feedback: data.feedback,
                reviewedAt: data.reviewedAt,
            };
        });
        const totalSnapshot = await mongodb_wrapper_1.organisationsCollection.get();
        res.json({
            success: true,
            data: {
                organisations,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalSnapshot.size,
                    totalPages: Math.ceil(totalSnapshot.size / limitNum),
                },
            },
        });
    }
    catch (error) {
        console.error("Get organisations error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get organisations",
        });
    }
});
router.post("/review/:id", auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = reviewSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
            return;
        }
        const { action, feedback } = value;
        const orgDoc = await mongodb_wrapper_1.organisationsCollection.doc(id).get();
        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }
        const orgData = orgDoc.data();
        if (orgData.status !== "pending") {
            res.status(400).json({
                success: false,
                error: "Can only review pending organisations",
            });
            return;
        }
        const now = new Date();
        const updateData = {
            status: action === "approve" ? "approved" : "declined",
            updatedAt: now,
            reviewedAt: now,
            adminId: req.user.id,
        };
        if (action === "decline" && feedback) {
            updateData.feedback = feedback;
        }
        await mongodb_wrapper_1.organisationsCollection.doc(id).update(updateData);
        try {
            if (action === "approve") {
                await (0, email_1.sendApprovalEmail)({
                    ...orgData,
                    id: orgDoc.id,
                });
            }
            else if (action === "decline" && feedback) {
                await (0, email_1.sendDeclineEmail)({
                    ...orgData,
                    id: orgDoc.id,
                }, feedback);
            }
        }
        catch (emailError) {
            console.error("Failed to send review email:", emailError);
        }
        res.json({
            success: true,
            data: {
                message: `Organisation ${action}d successfully`,
            },
        });
        return;
    }
    catch (error) {
        console.error("Review organisation error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to review organisation",
        });
        return;
    }
});
router.get("/stats", auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const [draftSnapshot, pendingSnapshot, approvedSnapshot, declinedSnapshot] = await Promise.all([
            mongodb_wrapper_1.organisationsCollection.where("status", "==", "draft").get(),
            mongodb_wrapper_1.organisationsCollection.where("status", "==", "pending").get(),
            mongodb_wrapper_1.organisationsCollection.where("status", "==", "approved").get(),
            mongodb_wrapper_1.organisationsCollection.where("status", "==", "declined").get(),
        ]);
        const stats = {
            draft: draftSnapshot.size,
            pending: pendingSnapshot.size,
            approved: approvedSnapshot.size,
            declined: declinedSnapshot.size,
            total: draftSnapshot.size + pendingSnapshot.size + approvedSnapshot.size + declinedSnapshot.size,
        };
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error("Get stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get statistics",
        });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map