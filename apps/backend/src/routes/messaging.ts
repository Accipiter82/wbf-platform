import { Router, Request, Response } from "express";
import { organisationsCollection, db, FieldValue, Timestamp } from "../services/mongodb-wrapper";
import { authenticateToken, requireOrganisation } from "../middleware/auth";
import { ApiResponse } from "../types";
import { sendDirectMessageEmail, sendApplicationEmail } from "../utils/email";

const router = Router();

// Collections
const conversationsCollection = db.collection('conversations');
const organisationConversationsCollection = db.collection('organisationConversations');

interface CreateConversationRequest {
    participantIds: string[];
    type: 'direct' | 'application' | 'notification';
    subject?: string;
    initialMessage: {
        content: string;
        type: 'text' | 'application' | 'notification';
        priority: 'low' | 'medium' | 'high';
        metadata?: any;
    };
    metadata?: {
        callId?: string;
        projectId?: string;
        applicationType?: 'call' | 'project';
        subject?: string;
        callTitle?: string;
        createdByOrganisationId?: string;
    };
}

interface SendMessageRequest {
    content: string;
    type: 'text' | 'application' | 'notification' | 'system';
    priority: 'low' | 'medium' | 'high';
    metadata?: any;
}

interface GetConversationsQuery {
    category?: 'inbox' | 'applications' | 'projects' | 'calls' | 'starred' | 'archived' | 'notifications';
    page?: string;
    limit?: string;
    search?: string;
}

// Helper function to generate conversation ID
function generateConversationId(participantIds: string[]): string {
    return participantIds.sort().join('_');
}

// Helper function to update organisation conversation metadata and per-org index
async function updateOrganisationConversation(
    organisationId: string,
    conversationId: string,
    category: string = 'inbox',
    incrementUnread: boolean = false,
    extraIndexFields: Record<string, any> = {}
) {
    const orgConvDocRef = organisationConversationsCollection.doc(organisationId);
    const orgIndexRef = orgConvDocRef.collection('conversations').doc(conversationId);

    // Update per-org index doc (fast listing and filtering)
    const indexUpdate: any = {
        category,
        lastAccessed: Timestamp.now(),
        ...extraIndexFields,
    };
    if (incrementUnread) {
        indexUpdate.unreadCount = FieldValue.increment(1);
    }
    await orgIndexRef.set(indexUpdate, { merge: true });

    // Also maintain category unread counters on the parent doc (for badges)
    const countersUpdate: any = {};
    if (incrementUnread) {
        countersUpdate.totalUnreadCount = FieldValue.increment(1);
        countersUpdate[`categories.${category}`] = FieldValue.increment(1);
    }
    if (Object.keys(countersUpdate).length > 0) {
        await orgConvDocRef.set(countersUpdate, { merge: true });
    }
}

// POST /messaging/conversations - Create new conversation
router.post("/conversations", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { participantIds, type, subject, initialMessage, metadata }: CreateConversationRequest = req.body;
        const senderId = req.user!.organisationId!;

        // Validate participants include sender
        if (!participantIds.includes(senderId)) {
            participantIds.push(senderId);
        }

        // Generate conversation ID
        const conversationId = generateConversationId(participantIds);

        // Check if conversation already exists
        const existingConv = await conversationsCollection.doc(conversationId).get();

        let conversation;
        if (existingConv.exists) {
            const existingConvData = existingConv.data()!;
            
            // Update participant names if they're missing (for backward compatibility)
            if (!existingConvData.participantNames) {
                const senderOrgDoc = await organisationsCollection.doc(senderId).get();
                const senderOrgData = senderOrgDoc.data();
                
                const recipientOrgId = participantIds.find(id => id !== senderId);
                let recipientOrgName = 'Unknown Organization';
                if (recipientOrgId) {
                    const recipientOrgDoc = await organisationsCollection.doc(recipientOrgId).get();
                    const recipientOrgData = recipientOrgDoc.data();
                    recipientOrgName = recipientOrgData?.name || recipientOrgData?.nameLocal || 'Unknown Organization';
                }

                await conversationsCollection.doc(conversationId).update({
                    participantNames: {
                        [senderId]: senderOrgData?.name || senderOrgData?.nameLocal || 'Unknown Organization',
                        ...(recipientOrgId ? { [recipientOrgId]: recipientOrgName } : {})
                    }
                });
            }
            
            conversation = { id: conversationId, ...existingConv.data() };
        } else {
            // Get sender and recipient organization names
            const senderOrgDoc = await organisationsCollection.doc(senderId).get();
            const senderOrgData = senderOrgDoc.data();
            
            // Get recipient organization name
            const recipientOrgId = participantIds.find(id => id !== senderId);
            let recipientOrgName = 'Unknown Organization';
            if (recipientOrgId) {
                const recipientOrgDoc = await organisationsCollection.doc(recipientOrgId).get();
                const recipientOrgData = recipientOrgDoc.data();
                recipientOrgName = recipientOrgData?.name || recipientOrgData?.nameLocal || 'Unknown Organization';
            }

            // Create new conversation
            const conversationData = {
                participants: participantIds,
                participantNames: {
                    [senderId]: senderOrgData?.name || senderOrgData?.nameLocal || 'Unknown Organization',
                    ...(recipientOrgId ? { [recipientOrgId]: recipientOrgName } : {})
                },
                type,
                metadata: metadata || {},
                lastMessage: {
                    content: initialMessage.content,
                    senderId,
                    timestamp: Timestamp.now(),
                    type: initialMessage.type
                },
                unreadCounts: participantIds.reduce((acc, id) => {
                    acc[id] = id === senderId ? 0 : 1;
                    return acc;
                }, {} as Record<string, number>),
                isArchived: participantIds.reduce((acc, id) => {
                    acc[id] = false;
                    return acc;
                }, {} as Record<string, boolean>),
                isStarred: participantIds.reduce((acc, id) => {
                    acc[id] = false;
                    return acc;
                }, {} as Record<string, boolean>),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            if (subject) {
                conversationData.metadata.subject = subject;
            }

            // Set metadata for application messages
            if (metadata) {
                conversationData.metadata = { ...conversationData.metadata, ...metadata };
            }

            await conversationsCollection.doc(conversationId).set(conversationData);
            conversation = { id: conversationId, ...conversationData };
        }

        // Get sender organisation details (if not already fetched above)
        const senderOrgDoc = await organisationsCollection.doc(senderId).get();
        const senderOrgData = senderOrgDoc.data();

        // Add initial message
        const messageData = {
            senderId,
            senderName: senderOrgData?.name || 'Unknown Organization',
            senderLogo: senderOrgData?.images?.logo || senderOrgData?.logo || '',
            content: initialMessage.content,
            type: initialMessage.type,
            priority: initialMessage.priority,
            metadata: initialMessage.metadata || {},
            isRead: participantIds.reduce((acc, id) => {
                acc[id] = id === senderId;
                return acc;
            }, {} as Record<string, boolean>),
            createdAt: Timestamp.now()
        };

        await conversationsCollection.doc(conversationId)
            .collection('messages')
            .add(messageData);

        // Update per-org indices for all participants
        for (const participantId of participantIds) {
            const isRecipient = participantId !== senderId;
            const category = type === 'application' ? 'applications' : (type === 'notification' ? 'notifications' : 'inbox');
            await updateOrganisationConversation(
                participantId,
                conversationId,
                category,
                isRecipient /* incrementUnread for recipients only */,
                {
                    // extra index fields for fast listing
                    lastMessageAt: Timestamp.now(),
                    lastMessagePreview: initialMessage.content?.slice(0, 160) || '',
                }
            );

            // Send email notification to recipients
            if (isRecipient) {
                const recipientOrgDoc = await organisationsCollection.doc(participantId).get();
                const recipientOrgData = recipientOrgDoc.data();
                if (recipientOrgData && recipientOrgData.contact?.email) {
                    if (type === 'application') {
                        // Send application email
                        await sendApplicationEmail(
                            recipientOrgData.contact.email,
                            recipientOrgData.name || recipientOrgData.nameLocal || 'Organization',
                            senderOrgData?.name || 'Unknown Organization',
                            metadata?.callTitle || 'Untitled Opportunity',
                            metadata?.applicationType || 'call'
                        );
                    } else if (type === 'direct') {
                        // Send direct message email
                        await sendDirectMessageEmail(
                            recipientOrgData.contact.email,
                            recipientOrgData.name || recipientOrgData.nameLocal || 'Organization',
                            senderOrgData?.name || 'Unknown Organization',
                            initialMessage.content
                        );
                    }
                }
            }
        }

        res.json({
            success: true,
            data: { conversation }
        });

    } catch (error: any) {
        console.error("Create conversation error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create conversation"
        });
    }
});

// GET /messaging/conversations - Get user's conversations
router.get("/conversations", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const organisationId = req.user?.organisationId;
        const { category = 'inbox', page = '1', limit = '20', search }: GetConversationsQuery = req.query as any;

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;

        console.log(`[DEBUG] Getting conversations for org: ${organisationId}, category: ${category}`);
        console.log(`[DEBUG] User object:`, req.user);

        if (!organisationId) {
            console.error('[ERROR] No organisationId found in request');
            return res.status(400).json({
                success: false,
                error: "Organisation ID not found"
            });
        }

        // Try to get from per-org index first, but fallback to legacy map or direct query
        const orgConvDocRef = organisationConversationsCollection.doc(organisationId);
        const orgConvDoc = await orgConvDocRef.get();
        const orgConvData = orgConvDoc.data();

        let conversations: any[] = [];
        let unreadCounts = {
            total: 0,
            inbox: 0,
            applications: 0,
            projects: 0,
            calls: 0,
            starred: 0,
            archived: 0,
            notifications: 0
        };

        // Prefer subcollection index if present
        const indexCol = orgConvDocRef.collection('conversations');
        // Map UI categories to index categories for clarity
        const categoryMap: Record<string, string[]> = {
            inbox: ['inbox'], // Only direct messages
            applications: ['applications'], // Only application messages
            starred: ['starred'],
            archived: ['archived'],
            notifications: ['notifications'],
        };
        const indexCategories = categoryMap[category] || ['inbox'];

        // Query the index with category filter
        let indexQuery: any;
        if (indexCategories.length === 1) {
            indexQuery = indexCol.where('category', '==', indexCategories[0]).orderBy('lastMessageAt', 'desc').limit(limitNum);
        } else {
            indexQuery = indexCol.where('category', 'in', indexCategories).orderBy('lastMessageAt', 'desc').limit(limitNum);
        }

        const indexSnapshot = await indexQuery.get();
        if (!indexSnapshot.empty) {
            console.log(`[DEBUG] Found ${indexSnapshot.size} indexed conversations for org in category ${category}`);

            const paginated = indexSnapshot.docs;

            // Load conversation docs in parallel
            const convPromises = paginated.map(async (d: any) => {
                const convId = d.id;
                const convDoc = await conversationsCollection.doc(convId).get();
                if (!convDoc.exists) return null;
                const convData = convDoc.data()!;

                if (search) {
                    const searchLower = search.toLowerCase();
                    const matchesSearch =
                        convData.lastMessage?.content?.toLowerCase().includes(searchLower) ||
                        convData.metadata?.subject?.toLowerCase().includes(searchLower) ||
                        convData.participants.some((p: string) => p.toLowerCase().includes(searchLower));
                    if (!matchesSearch) return null;
                }

                // Get unreadCount from index document first (most accurate), then fallback to conversation document
                const indexData = d.data();
                const indexUnreadCount = indexData.unreadCount !== undefined ? indexData.unreadCount : null;
                const convUnreadCount = convData.unreadCounts?.[organisationId] || 0;
                // Use index unreadCount as primary source (even if 0) since it's updated when messages are marked as read
                // Only fallback to convUnreadCount if index unreadCount is not set
                const finalUnreadCount = indexUnreadCount !== null ? indexUnreadCount : convUnreadCount;
                
                return {
                    id: convId,
                    ...convData,
                    unreadCount: finalUnreadCount,
                    isArchived: convData.isArchived?.[organisationId] || false,
                    isStarred: convData.isStarred?.[organisationId] || false,
                    lastMessage: convData.lastMessage || null
                };
            });
            const convResults = await Promise.all(convPromises);
            conversations = convResults.filter(Boolean) as any[];

            // Build unread counts from parent counters if available; otherwise compute from index
            if (orgConvData?.categories) {
                unreadCounts = {
                    total: orgConvData?.totalUnreadCount || 0,
                    inbox: orgConvData?.categories?.inbox || 0,
                    applications: orgConvData?.categories?.applications || 0,
                    projects: orgConvData?.categories?.projects || 0,
                    calls: orgConvData?.categories?.calls || 0,
                    starred: orgConvData?.categories?.starred || 0,
                    archived: orgConvData?.categories?.archived || 0,
                    notifications: orgConvData?.categories?.notifications || 0,
                };
            } else {
                // Aggregate from all index docs (capped to 500 for performance)
                const allIndexSnapshot = await indexCol.orderBy('lastMessageAt', 'desc').limit(500).get();
                const counters = {
                    total: 0, inbox: 0, applications: 0, projects: 0, calls: 0, starred: 0, archived: 0, notifications: 0,
                } as any;
                allIndexSnapshot.docs.forEach((d: any) => {
                    const data = d.data();
                    const unread = Number(data.unreadCount || 0);
                    counters.total += unread;
                    if (data.category && data.category in counters) {
                        counters[data.category] += unread;
                    }
                });
                unreadCounts = counters;
            }

        } else if (orgConvData?.conversations && Object.keys(orgConvData.conversations).length > 0) {
            console.log(`[DEBUG] Found ${Object.keys(orgConvData.conversations).length} conversations in orgConvData`);

            // Use existing logic with organisationConversations
            let conversationIds = Object.keys(orgConvData.conversations);

            // Filter by category (strict filtering to prevent mixing)
            conversationIds = conversationIds.filter(convId =>
                orgConvData.conversations[convId]?.category === category
            );

            console.log(`[DEBUG] Filtered to ${conversationIds.length} conversations for category ${category}`);

            if (conversationIds.length > 0) {
                const startIdx = (pageNum - 1) * limitNum;
                const paginatedIds = conversationIds.slice(startIdx, startIdx + limitNum);

                const conversationPromises = paginatedIds.map(async (convId) => {
                    const convDoc = await conversationsCollection.doc(convId).get();
                    if (!convDoc.exists) return null;

                    const convData = convDoc.data()!;

                    if (search) {
                        const searchLower = search.toLowerCase();
                        const matchesSearch =
                            convData.lastMessage?.content?.toLowerCase().includes(searchLower) ||
                            convData.metadata?.subject?.toLowerCase().includes(searchLower) ||
                            convData.participants.some((p: string) => p.toLowerCase().includes(searchLower));

                        if (!matchesSearch) return null;
                    }

                    return {
                        id: convId,
                        ...convData,
                        unreadCount: convData.unreadCounts?.[organisationId] || 0,
                        isArchived: convData.isArchived?.[organisationId] || false,
                        isStarred: convData.isStarred?.[organisationId] || false,
                        lastMessage: convData.lastMessage || null
                    };
                });

                const conversationResults = await Promise.all(conversationPromises);
                conversations = conversationResults.filter(conv => conv !== null);
            }

            unreadCounts = {
                total: orgConvData.totalUnreadCount || 0,
                inbox: orgConvData.categories?.inbox || 0,
                applications: orgConvData.categories?.applications || 0,
                projects: orgConvData.categories?.projects || 0,
                calls: orgConvData.categories?.calls || 0,
                starred: orgConvData.categories?.starred || 0,
                archived: orgConvData.categories?.archived || 0,
                notifications: orgConvData.categories?.notifications || 0
            };

        } else {
            console.log(`[DEBUG] No orgConvData found, querying conversations directly`);

            try {
                // Fallback: Query conversations collection directly (without orderBy to avoid composite index requirement)
                const conversationsQuery = conversationsCollection
                    .where('participants', 'array-contains', organisationId)
                    .limit(limitNum * 3); // Get more to account for filtering and sorting

                const conversationsSnapshot = await conversationsQuery.get();
                console.log(`[DEBUG] Found ${conversationsSnapshot.docs.length} conversations directly`);

                const allConversations = conversationsSnapshot.docs.map((doc: any) => {
                    const convData = doc.data();
                    return {
                        id: doc.id,
                        type: convData.type,
                        metadata: convData.metadata,
                        participants: convData.participants,
                        ...convData,
                        unreadCount: convData.unreadCounts?.[organisationId] || 0,
                        isArchived: convData.isArchived?.[organisationId] || false,
                        isStarred: convData.isStarred?.[organisationId] || false,
                        lastMessage: convData.lastMessage || null
                    };
                });

                // Apply category and search filters
                let filteredConversations = allConversations;
                
                // Filter by conversation type based on category
                if (category === 'inbox') {
                    filteredConversations = filteredConversations.filter((conv: any) => conv.type === 'direct');
                } else if (category === 'applications') {
                    filteredConversations = filteredConversations.filter((conv: any) => conv.type === 'application');
                }
                
                if (search) {
                    const searchLower = search.toLowerCase();
                    filteredConversations = filteredConversations.filter((conv: any) =>
                        conv.lastMessage?.content?.toLowerCase().includes(searchLower) ||
                        conv.metadata?.subject?.toLowerCase().includes(searchLower) ||
                        conv.participants.some((p: string) => p.toLowerCase().includes(searchLower))
                    );
                }

                // Sort by updatedAt/lastMessage timestamp desc
                filteredConversations.sort((a: any, b: any) => {
                    const aTime = a.lastMessage?.timestamp?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
                    const bTime = b.lastMessage?.timestamp?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });

                // Pagination
                const startIdx = (pageNum - 1) * limitNum;
                conversations = filteredConversations.slice(startIdx, startIdx + limitNum);

                // Backfill per-org index for faster next calls (best-effort)
                const backfillBatch = db.batch();
                const computeCategory = (conv: any): string => {
                    if (conv.isArchived) return 'archived';
                    if (conv.isStarred) return 'starred';
                    if (conv.type === 'notification') return 'notifications';
                    if (conv.type === 'application') return 'applications';
                    return 'inbox';
                };
                filteredConversations.slice(0, 50).forEach((conv: any) => {
                    const orgConvRef = organisationConversationsCollection.doc(organisationId);
                    const indexDocRef = orgConvRef.collection('conversations').doc(conv.id);
                    backfillBatch.set(indexDocRef, {
                        category: computeCategory(conv),
                        lastAccessed: Timestamp.now(),
                        lastMessageAt: (conv.lastMessage?.timestamp as any) || Timestamp.now(),
                        lastMessagePreview: conv.lastMessage?.content?.slice(0, 160) || '',
                        unreadCount: conv.unreadCount || 0,
                    }, { merge: true });
                });
                await backfillBatch.commit();

                // Calculate unread counts from the conversations
                unreadCounts = {
                    total: allConversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0),
                    inbox: allConversations.filter((conv: any) => conv.type !== 'notification' && !conv.isArchived).reduce((sum: number, conv: any) => sum + conv.unreadCount, 0),
                    applications: allConversations.filter((conv: any) => conv.type === 'application' && !conv.isArchived).reduce((sum: number, conv: any) => sum + conv.unreadCount, 0),
                    projects: 0, // Legacy
                    calls: 0, // Legacy  
                    starred: allConversations.filter((conv: any) => conv.isStarred).reduce((sum: number, conv: any) => sum + conv.unreadCount, 0),
                    archived: allConversations.filter((conv: any) => conv.isArchived).reduce((sum: number, conv: any) => sum + conv.unreadCount, 0),
                    notifications: allConversations.filter((conv: any) => conv.type === 'notification' && !conv.isArchived).reduce((sum: number, conv: any) => sum + conv.unreadCount, 0)
                };
            } catch (fallbackError: any) {
                console.error(`[ERROR] Fallback query failed:`, fallbackError);
                // Return empty result rather than throwing
                conversations = [];
                unreadCounts = {
                    total: 0, inbox: 0, applications: 0, projects: 0, calls: 0,
                    starred: 0, archived: 0, notifications: 0
                };
            }
        }

        // Sort conversations by last message timestamp
        conversations.sort((a, b) => {
            const aTime = a.lastMessage?.timestamp?.toMillis() || 0;
            const bTime = b.lastMessage?.timestamp?.toMillis() || 0;
            return bTime - aTime;
        });

        console.log(`[DEBUG] Returning ${conversations.length} conversations`);

        return res.json({
            success: true,
            data: {
                conversations,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: conversations.length,
                    totalPages: Math.ceil(conversations.length / limitNum)
                },
                unreadCounts
            }
        });

    } catch (error: any) {
        console.error("Get conversations error:", error);
        console.error("Error details:", error.message);
        console.error("Stack trace:", error.stack);
        return res.status(500).json({
            success: false,
            error: `Failed to get conversations: ${error.message}`
        });
    }
});

// GET /messaging/conversations/:id/messages - Get messages in a conversation
router.get("/conversations/:id/messages", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const conversationId = req.params.id;
        const organisationId = req.user!.organisationId!;
        const { page = '1', limit = '50' } = req.query;

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 50;

        // Verify user is participant
        const convDoc = await conversationsCollection.doc(conversationId).get();
        if (!convDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Conversation not found"
            });
        }

        const convData = convDoc.data()!;
        if (!convData.participants.includes(organisationId)) {
            return res.status(403).json({
                success: false,
                error: "Access denied"
            });
        }

        // Get messages with pagination for response
        const messagesRef = conversationsCollection.doc(conversationId).collection('messages');
        const messagesQuery = messagesRef
            .orderBy('createdAt', 'desc')
            .limit(limitNum);

        const messagesSnapshot = await messagesQuery.get();
        // Apply pagination manually since MongoDB doesn't have offset
        const skip = (pageNum - 1) * limitNum;
        const paginatedDocs = messagesSnapshot.docs.slice(skip, skip + limitNum);
        const messages = paginatedDocs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            isRead: doc.data().isRead?.[organisationId] || false
        }));

        // Mark ALL unread messages as read when conversation is opened
        const unreadCount = convData.unreadCounts?.[organisationId] || 0;
        
        // Determine category for this conversation
        const category = convData.type === 'notification' ? 'notifications' : 
                        (convData.type === 'application' ? 'applications' : 'inbox');

        // Update organisation conversation metadata - per-org index
        const orgConvRef = organisationConversationsCollection.doc(organisationId);
        const orgIndexRef = orgConvRef.collection('conversations').doc(conversationId);
        
        // Check if index document exists to get existing fields (before batch operations)
        const indexDoc = await orgIndexRef.get();
        const indexData = indexDoc.data();
        
        // Get all messages to find unread ones (limit to reasonable batch size for performance)
        const allMessagesQuery = messagesRef
            .orderBy('createdAt', 'desc')
            .limit(500); // Reasonable limit to avoid performance issues

        const allMessagesSnapshot = await allMessagesQuery.get();
        
        // Create batch for all updates
        const batch = db.batch();
        let hasUpdates = false;
        
        // Find and mark all unread messages
        let markedCount = 0;
        for (const doc of allMessagesSnapshot.docs) {
            const messageData = doc.data();
            if (!messageData.isRead?.[organisationId]) {
                // Get the message reference using conversationId and messageId
                const messageRef = conversationsCollection.doc(conversationId).collection('messages').doc(doc.id);
                batch.update(messageRef, {
                    [`isRead.${organisationId}`]: true
                });
                markedCount++;
                hasUpdates = true;
            }
        }

        // Always update conversation unread count to 0 when conversation is opened
        // This ensures the count is reset even if it was already 0
        if (unreadCount > 0 || markedCount > 0) {
            batch.update(conversationsCollection.doc(conversationId), {
                [`unreadCounts.${organisationId}`]: 0
            });
            hasUpdates = true;
        }
        
        // Always update per-org index document to ensure unreadCount is 0
        // Use set with merge to ensure document exists and preserve other fields
        const indexUpdate: any = {
            unreadCount: 0,
            lastAccessed: Timestamp.now(),
            category: category
        };
        
        // Preserve lastMessageAt if it exists, otherwise use conversation's lastMessage timestamp
        if (indexData?.lastMessageAt) {
            indexUpdate.lastMessageAt = indexData.lastMessageAt;
        } else if (convData.lastMessage?.timestamp) {
            indexUpdate.lastMessageAt = convData.lastMessage.timestamp;
        } else {
            indexUpdate.lastMessageAt = Timestamp.now();
        }
        
        // Preserve lastMessagePreview if it exists
        if (indexData?.lastMessagePreview) {
            indexUpdate.lastMessagePreview = indexData.lastMessagePreview;
        } else if (convData.lastMessage?.content) {
            indexUpdate.lastMessagePreview = convData.lastMessage.content.slice(0, 160);
        }
        
        batch.set(orgIndexRef, indexUpdate, { merge: true });
        hasUpdates = true;

        // Update parent counters only if there were unread messages
        if (unreadCount > 0) {
            batch.update(orgConvRef, {
                [`conversations.${conversationId}.unreadCount`]: 0,
                totalUnreadCount: FieldValue.increment(-unreadCount),
                [`categories.${category}`]: FieldValue.increment(-unreadCount)
            });
        } else {
            // Even if unreadCount was 0, ensure the parent document has the correct value
            batch.set(orgConvRef, {
                [`conversations.${conversationId}.unreadCount`]: 0,
            }, { merge: true });
        }

        // Commit batch if there are any updates
        if (hasUpdates || unreadCount > 0) {
            await batch.commit();
            console.log(`[DEBUG] Marked ${markedCount} messages as read for conversation ${conversationId}, updated unreadCount to 0`);
        }
        
        // Update convData for response - always set to 0
        convData.unreadCounts = {
            ...convData.unreadCounts,
            [organisationId]: 0
        };

        // Ensure unreadCount is set to 0 in the response conversation object
        const responseConversation = {
            id: conversationId,
            ...convData,
            unreadCount: convData.unreadCounts?.[organisationId] || 0
        };

        return res.json({
            success: true,
            data: {
                messages: messages.reverse(), // Return in chronological order
                conversation: responseConversation
            }
        });

    } catch (error: any) {
        console.error("Get messages error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get messages"
        });
    }
});

// POST /messaging/conversations/:id/messages - Send message
router.post("/conversations/:id/messages", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const conversationId = req.params.id;
        const organisationId = req.user!.organisationId!;
        const { content, type = 'text', priority, metadata }: SendMessageRequest = req.body;

        // Verify user is participant
        const convDoc = await conversationsCollection.doc(conversationId).get();
        if (!convDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Conversation not found"
            });
        }

        const convData = convDoc.data()!;
        if (!convData.participants.includes(organisationId)) {
            return res.status(403).json({
                success: false,
                error: "Access denied"
            });
        }

        // Get sender organisation details
        const senderOrgDoc = await organisationsCollection.doc(organisationId).get();
        const senderOrgData = senderOrgDoc.data();

        // Create message
        const messageData = {
            senderId: organisationId,
            senderName: senderOrgData?.name || 'Unknown Organization',
            senderLogo: senderOrgData?.images?.logo || senderOrgData?.logo || '',
            content,
            type,
            priority: priority || 'medium', // Default to medium if not provided
            metadata: metadata || {},
            isRead: convData.participants.reduce((acc: Record<string, boolean>, id: string) => {
                acc[id] = id === organisationId;
                return acc;
            }, {}),
            createdAt: Timestamp.now()
        };

        const messageRef = await conversationsCollection.doc(conversationId)
            .collection('messages')
            .add(messageData);

        // Update conversation and organisation conversations in a single batch
        const batch = db.batch();

        // Update main conversation
        batch.update(conversationsCollection.doc(conversationId), {
            lastMessage: {
                content,
                senderId: organisationId,
                timestamp: Timestamp.now(),
                type
            },
            updatedAt: Timestamp.now(),
            // Increment unread count for other participants
            ...convData.participants.reduce((acc: Record<string, any>, id: string) => {
                if (id !== organisationId) {
                    acc[`unreadCounts.${id}`] = FieldValue.increment(1);
                }
                return acc;
            }, {})
        });

        // Update per-org indices for other participants in the same batch
        for (const participantId of convData.participants) {
            if (participantId !== organisationId) {
                const orgConvRef = organisationConversationsCollection.doc(participantId);
                const category = convData.type === 'notification' ? 'notifications' :
                    (convData.type === 'application' ? 'applications' : 'inbox');

                // Update per-org index doc
                const indexDocRef = orgConvRef.collection('conversations').doc(conversationId);
                batch.set(indexDocRef, {
                    category,
                    lastAccessed: Timestamp.now(),
                    lastMessageAt: Timestamp.now(),
                    lastMessagePreview: content?.slice(0, 160) || '',
                    unreadCount: FieldValue.increment(1),
                }, { merge: true });

                // Update parent counters
                batch.set(orgConvRef, {
                    totalUnreadCount: FieldValue.increment(1),
                    [`categories.${category}`]: FieldValue.increment(1),
                }, { merge: true });
            }
        }

        await batch.commit();

        // Send email notifications to all recipients (other participants)
        const recipientIds = convData.participants.filter((id: string) => id !== organisationId);
        
        for (const recipientId of recipientIds) {
            try {
                const recipientOrgDoc = await organisationsCollection.doc(recipientId).get();
                const recipientOrgData = recipientOrgDoc.data();
                
                if (recipientOrgData && recipientOrgData.contact?.email) {
                    const recipientName = recipientOrgData.name || recipientOrgData.nameLocal || 'Organization';
                    const senderName = senderOrgData?.name || 'Unknown Organization';
                    
                    if (convData.type === 'application') {
                        // Send application message email
                        await sendApplicationEmail(
                            recipientOrgData.contact.email,
                            recipientName,
                            senderName,
                            convData.metadata?.callTitle || 'Untitled Opportunity',
                            convData.metadata?.applicationType || 'call'
                        );
                    } else {
                        // Send direct message email
                        await sendDirectMessageEmail(
                            recipientOrgData.contact.email,
                            recipientName,
                            senderName,
                            content
                        );
                    }
                }
            } catch (emailError) {
                // Log error but don't fail the request if email fails
                console.error(`Error sending email notification to ${recipientId}:`, emailError);
            }
        }

        return res.json({
            success: true,
            data: {
                message: {
                    id: messageRef.id,
                    ...messageData
                }
            }
        });

    } catch (error: any) {
        console.error("Send message error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to send message"
        });
    }
});

// PUT /messaging/conversations/:id/star - Toggle star status
router.put("/conversations/:id/star", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const conversationId = req.params.id;
        const organisationId = req.user!.organisationId!;
        const { starred } = req.body;

        await conversationsCollection.doc(conversationId).update({
            [`isStarred.${organisationId}`]: starred
        });

        // Update organisation conversation category
        const category = starred ? 'starred' : 'inbox';
        await updateOrganisationConversation(organisationId, conversationId, category);

        res.json({
            success: true,
            data: { starred }
        });

    } catch (error: any) {
        console.error("Toggle star error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to toggle star"
        });
    }
});

// PUT /messaging/conversations/:id/archive - Toggle archive status
router.put("/conversations/:id/archive", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const conversationId = req.params.id;
        const organisationId = req.user!.organisationId!;
        const { archived } = req.body;

        await conversationsCollection.doc(conversationId).update({
            [`isArchived.${organisationId}`]: archived
        });

        // Update organisation conversation category
        const category = archived ? 'archived' : 'inbox';
        await updateOrganisationConversation(organisationId, conversationId, category);

        res.json({
            success: true,
            data: { archived }
        });

    } catch (error: any) {
        console.error("Toggle archive error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to toggle archive"
        });
    }
});

// GET /messaging/unread-count - Get total unread count for badges
router.get("/unread-count", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const organisationId = req.user!.organisationId!;

        const orgConvDoc = await organisationConversationsCollection.doc(organisationId ?? 'unknown').get();
        const data = orgConvDoc.data();

        res.json({
            success: true,
            data: {
                totalUnreadCount: data?.totalUnreadCount || 0,
                categories: data?.categories || {
                    inbox: 0,
                    applications: 0,
                    projects: 0,
                    calls: 0,
                    starred: 0,
                    archived: 0,
                    notifications: 0
                }
            }
        });

    } catch (error: any) {
        console.error("Get unread count error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get unread count"
        });
    }
});

// POST /messaging/notifications/activity - Create activity notification
router.post("/notifications/activity", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const senderId = req.user!.organisationId!;
        const { recipientId, activityType, metadata } = req.body;

        if (!recipientId || !activityType) {
            return res.status(400).json({
                success: false,
                error: "recipientId and activityType are required"
            });
        }

        // Don't send notifications to self
        if (senderId === recipientId) {
            return res.json({
                success: true,
                data: { message: "No notification sent to self" }
            });
        }

        // Get sender organisation details
        const senderOrgDoc = await organisationsCollection.doc(senderId).get();
        const senderOrgData = senderOrgDoc.data();

        if (!senderOrgData) {
            return res.status(404).json({
                success: false,
                error: "Sender organisation not found"
            });
        }

        // Generate notification content based on activity type
        let notificationContent = '';
        let notificationSubject = '';

        switch (activityType) {
            case 'call_like':
                notificationContent = `${senderOrgData.name} liked your call: ${metadata?.callTitle || 'Untitled Call'}`;
                notificationSubject = 'Call Liked';
                break;
            case 'project_like':
                notificationContent = `${senderOrgData.name} liked your project: ${metadata?.projectTitle || 'Untitled Project'}`;
                notificationSubject = 'Project Liked';
                break;
            case 'call_application':
                notificationContent = `${senderOrgData.name} applied to your call: ${metadata?.callTitle || 'Untitled Call'}`;
                notificationSubject = 'New Application Received';
                break;
            case 'project_application':
                notificationContent = `${senderOrgData.name} applied to your project: ${metadata?.projectTitle || 'Untitled Project'}`;
                notificationSubject = 'New Application Received';
                break;
            default:
                notificationContent = `${senderOrgData.name} performed an activity related to your organisation`;
                notificationSubject = 'Activity Notification';
        }

        // Create notification conversation
        const participantIds = [recipientId, senderId];
        const conversationId = generateConversationId(participantIds);

        // Check if notification conversation already exists for this activity
        const existingConv = await conversationsCollection.doc(conversationId).get();

        if (existingConv.exists) {
            // Add message to existing conversation
            const messageData = {
                senderId,
                senderName: senderOrgData.name,
                senderLogo: senderOrgData.images?.logo || senderOrgData.logo || '',
                content: notificationContent,
                type: 'notification',
                priority: 'medium',
                metadata: {
                    activityType,
                    ...metadata
                },
                isRead: participantIds.reduce((acc, id) => {
                    acc[id] = id === senderId;
                    return acc;
                }, {} as Record<string, boolean>),
                createdAt: Timestamp.now()
            };

            await conversationsCollection.doc(conversationId)
                .collection('messages')
                .add(messageData);

            // Update conversation last message
            await conversationsCollection.doc(conversationId).update({
                lastMessage: {
                    content: notificationContent,
                    senderId,
                    timestamp: Timestamp.now(),
                    type: 'notification'
                },
                updatedAt: Timestamp.now(),
                [`unreadCounts.${recipientId}`]: FieldValue.increment(1)
            });

            // Update recipient's organisation conversation
            await updateOrganisationConversation(recipientId, conversationId, 'notifications', true);

        } else {
            // Create new notification conversation
            const conversationData = {
                participants: participantIds,
                type: 'notification',
                metadata: {
                    subject: notificationSubject,
                    activityType,
                    ...metadata
                },
                lastMessage: {
                    content: notificationContent,
                    senderId,
                    timestamp: Timestamp.now(),
                    type: 'notification'
                },
                unreadCounts: participantIds.reduce((acc, id) => {
                    acc[id] = id === senderId ? 0 : 1;
                    return acc;
                }, {} as Record<string, number>),
                isArchived: participantIds.reduce((acc, id) => {
                    acc[id] = false;
                    return acc;
                }, {} as Record<string, boolean>),
                isStarred: participantIds.reduce((acc, id) => {
                    acc[id] = false;
                    return acc;
                }, {} as Record<string, boolean>),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            await conversationsCollection.doc(conversationId).set(conversationData);

            // Add initial message
            const messageData = {
                senderId,
                senderName: senderOrgData.name,
                senderLogo: senderOrgData.images?.logo || senderOrgData.logo || '',
                content: notificationContent,
                type: 'notification',
                priority: 'medium',
                metadata: {
                    activityType,
                    ...metadata
                },
                isRead: participantIds.reduce((acc, id) => {
                    acc[id] = id === senderId;
                    return acc;
                }, {} as Record<string, boolean>),
                createdAt: Timestamp.now()
            };

            await conversationsCollection.doc(conversationId)
                .collection('messages')
                .add(messageData);

            // Update organisation conversations for participants
            await updateOrganisationConversation(recipientId, conversationId, 'notifications', true);
            await updateOrganisationConversation(senderId, conversationId, 'notifications', false);
        }

        return res.json({
            success: true,
            data: { message: 'Notification created successfully' }
        });

    } catch (error: any) {
        console.error("Create activity notification error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to create activity notification"
        });
    }
});

// Simple test endpoint
router.get("/test", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        return res.json({
            success: true,
            data: {
                message: "Messaging API is working",
                organisationId: req.user?.organisationId,
                user: req.user
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DEBUG endpoint to check conversations directly
router.get("/debug/conversations", authenticateToken, requireOrganisation, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const organisationId = req.user?.organisationId;

        console.log(`[DEBUG] Debug endpoint called for org: ${organisationId}`);

        // 1. Check all conversations in the collection (first 10)
        const allConversationsQuery = conversationsCollection.orderBy('updatedAt', 'desc').limit(10);
        const allConversationsSnapshot = await allConversationsQuery.get();
        const allConversations = allConversationsSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            participants: doc.data().participants,
            type: doc.data().type,
            lastMessage: doc.data().lastMessage
        }));

        // 2. Query conversations with array-contains
        const userConversationsQuery = conversationsCollection
            .where('participants', 'array-contains', organisationId)
            .limit(10);

        const userConversationsSnapshot = await userConversationsQuery.get();
        const userConversations = userConversationsSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));

        // 3. Also check organisationConversations
        const orgConvDoc = await organisationConversationsCollection.doc(organisationId || 'unknown').get();
        const orgConvData = orgConvDoc.data();

        // 4. Check if organisationId appears in any participants array
        const participantMatches = allConversations.filter((conv: any) =>
            conv.participants && organisationId && conv.participants.includes(organisationId)
        );

        return res.json({
            success: true,
            data: {
                organisationId,
                totalConversationsInDB: allConversations.length,
                allConversationsSample: allConversations,
                userConversationsFound: userConversations.length,
                userConversations: userConversations,
                participantMatches: participantMatches,
                orgConversationsData: orgConvData,
                orgConversationsExists: !!orgConvData
            }
        });

    } catch (error: any) {
        console.error("Debug conversations error:", error);
        return res.status(500).json({
            success: false,
            error: `Failed to debug conversations: ${error.message}`
        });
    }
});

export default router;
