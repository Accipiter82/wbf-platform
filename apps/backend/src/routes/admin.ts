import { Router, Request, Response } from "express";
import Joi from "joi";
import { organisationsCollection, adminUsersCollection } from "../services/mongodb-wrapper";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { sendApprovalEmail, sendDeclineEmail } from "../utils/email";
import { ApiResponse, ReviewRequest, Organisation } from "../types";

const router = Router();

// Validation schema for review requests
const reviewSchema = Joi.object({
    action: Joi.string().valid("approve", "decline").required(),
    feedback: Joi.string().when("action", {
        is: "decline",
        then: Joi.string().min(10).max(1000).required(),
        otherwise: Joi.string().optional(),
    }),
});

// GET /admin/pending - Get all pending organisations
router.get("/pending", authenticateToken, requireAdmin, async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        const { page = "1", limit = "10" } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const offset = (pageNum - 1) * limitNum;

        const snapshot = await organisationsCollection
            .where("status", "==", "pending")
            .orderBy("createdAt", "desc")
            .limit(limitNum)
            .get();

        const organisations = snapshot.docs.map((doc: any) => {
            const data = doc.data() as Organisation;
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

        // Get total count for pagination
        const totalSnapshot = await organisationsCollection
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
    } catch (error: any) {
        console.error("Get pending organisations error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get pending organisations",
        });
        return;
    }
});

// GET /admin/organisations - Get all organisations with status filter
router.get("/organisations", authenticateToken, requireAdmin, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { status, page = "1", limit = "10" } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const offset = (pageNum - 1) * limitNum;

        let query: any = organisationsCollection.orderBy("createdAt", "desc");

        // Apply status filter if provided
        if (status && ["draft", "pending", "approved", "declined"].includes(status as string)) {
            query = query.where("status", "==", status);
        }

        const snapshot = await query.limit(limitNum).get();

        const organisations = snapshot.docs.map((doc: any) => {
            const data = doc.data() as Organisation;
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

        // Get total count for pagination
        const totalSnapshot = await organisationsCollection.get();

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
    } catch (error: any) {
        console.error("Get organisations error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get organisations",
        });
    }
});

// POST /admin/review/:id - Review (approve/decline) an organisation
router.post("/review/:id", authenticateToken, requireAdmin, async (req: Request, res: Response<ApiResponse>): Promise<Response | void> => {
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

        const { action, feedback }: ReviewRequest = value;

        // Get organisation
        const orgDoc = await organisationsCollection.doc(id).get();
        if (!orgDoc.exists) {
            res.status(404).json({
                success: false,
                error: "Organisation not found",
            });
            return;
        }

        const orgData = orgDoc.data() as Organisation;

        // Check if organisation is pending
        if (orgData.status !== "pending") {
            res.status(400).json({
                success: false,
                error: "Can only review pending organisations",
            });
            return;
        }

        const now = new Date();
        const updateData: Partial<Organisation> = {
            status: action === "approve" ? "approved" : "declined",
            updatedAt: now,
            reviewedAt: now,
            adminId: req.user!.id,
        };

        if (action === "decline" && feedback) {
            updateData.feedback = feedback;
        }

        await organisationsCollection.doc(id).update(updateData);

        // Send email notification
        try {
            if (action === "approve") {
                await sendApprovalEmail({
                    ...orgData,
                    id: orgDoc.id,
                });
            } else if (action === "decline" && feedback) {
                await sendDeclineEmail({
                    ...orgData,
                    id: orgDoc.id,
                }, feedback);
            }
        } catch (emailError) {
            console.error("Failed to send review email:", emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            data: {
                message: `Organisation ${action}d successfully`,
            },
        });
        return;
    } catch (error: any) {
        console.error("Review organisation error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to review organisation",
        });
        return;
    }
});

// GET /admin/stats - Get dashboard statistics
router.get("/stats", authenticateToken, requireAdmin, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const [draftSnapshot, pendingSnapshot, approvedSnapshot, declinedSnapshot] = await Promise.all([
            organisationsCollection.where("status", "==", "draft").get(),
            organisationsCollection.where("status", "==", "pending").get(),
            organisationsCollection.where("status", "==", "approved").get(),
            organisationsCollection.where("status", "==", "declined").get(),
        ]) as any[];

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
    } catch (error: any) {
        console.error("Get stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get statistics",
        });
    }
});

export default router; 