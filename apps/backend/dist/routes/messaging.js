"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongodb_wrapper_1 = require("../services/mongodb-wrapper");
const auth_1 = require("../middleware/auth");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
const conversationsCollection = mongodb_wrapper_1.db.collection('conversations');
const organisationConversationsCollection = mongodb_wrapper_1.db.collection('organisationConversations');
function generateConversationId(participantIds) {
    return participantIds.sort().join('_');
}
async function updateOrganisationConversation(organisationId, conversationId, category = 'inbox', incrementUnread = false, extraIndexFields = {}) {
    const orgConvDocRef = organisationConversationsCollection.doc(organisationId);
    const orgIndexRef = orgConvDocRef.collection('conversations').doc(conversationId);
    const indexUpdate = {
        category,
        lastAccessed: mongodb_wrapper_1.Timestamp.now(),
        ...extraIndexFields,
    };
    if (incrementUnread) {
        indexUpdate.unreadCount = mongodb_wrapper_1.FieldValue.increment(1);
    }
    await orgIndexRef.set(indexUpdate, { merge: true });
    const countersUpdate = {};
    if (incrementUnread) {
        countersUpdate.totalUnreadCount = mongodb_wrapper_1.FieldValue.increment(1);
        countersUpdate[`categories.${category}`] = mongodb_wrapper_1.FieldValue.increment(1);
    }
    if (Object.keys(countersUpdate).length > 0) {
        await orgConvDocRef.set(countersUpdate, { merge: true });
    }
}
router.post("/conversations", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const { participantIds, type, subject, initialMessage, metadata } = req.body;
        const senderId = req.user.organisationId;
        if (!participantIds.includes(senderId)) {
            participantIds.push(senderId);
        }
        const conversationId = generateConversationId(participantIds);
        const existingConv = await conversationsCollection.doc(conversationId).get();
        let conversation;
        if (existingConv.exists) {
            const existingConvData = existingConv.data();
            if (!existingConvData.participantNames) {
                const senderOrgDoc = await mongodb_wrapper_1.organisationsCollection.doc(senderId).get();
                const senderOrgData = senderOrgDoc.data();
                const recipientOrgId = participantIds.find(id => id !== senderId);
                let recipientOrgName = 'Unknown Organization';
                if (recipientOrgId) {
                    const recipientOrgDoc = await mongodb_wrapper_1.organisationsCollection.doc(recipientOrgId).get();
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
        }
        else {
            const senderOrgDoc = await mongodb_wrapper_1.organisationsCollection.doc(senderId).get();
            const senderOrgData = senderOrgDoc.data();
            const recipientOrgId = participantIds.find(id => id !== senderId);
            let recipientOrgName = 'Unknown Organization';
            if (recipientOrgId) {
                const recipientOrgDoc = await mongodb_wrapper_1.organisationsCollection.doc(recipientOrgId).get();
                const recipientOrgData = recipientOrgDoc.data();
                recipientOrgName = recipientOrgData?.name || recipientOrgData?.nameLocal || 'Unknown Organization';
            }
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
                    timestamp: mongodb_wrapper_1.Timestamp.now(),
                    type: initialMessage.type
                },
                unreadCounts: participantIds.reduce((acc, id) => {
                    acc[id] = id === senderId ? 0 : 1;
                    return acc;
                }, {}),
                isArchived: participantIds.reduce((acc, id) => {
                    acc[id] = false;
                    return acc;
                }, {}),
                isStarred: participantIds.reduce((acc, id) => {
                    acc[id] = false;
                    return acc;
                }, {}),
                createdAt: mongodb_wrapper_1.Timestamp.now(),
                updatedAt: mongodb_wrapper_1.Timestamp.now()
            };
            if (subject) {
                conversationData.metadata.subject = subject;
            }
            if (metadata) {
                conversationData.metadata = { ...conversationData.metadata, ...metadata };
            }
            await conversationsCollection.doc(conversationId).set(conversationData);
            conversation = { id: conversationId, ...conversationData };
        }
        const senderOrgDoc = await mongodb_wrapper_1.organisationsCollection.doc(senderId).get();
        const senderOrgData = senderOrgDoc.data();
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
            }, {}),
            createdAt: mongodb_wrapper_1.Timestamp.now()
        };
        await conversationsCollection.doc(conversationId)
            .collection('messages')
            .add(messageData);
        for (const participantId of participantIds) {
            const isRecipient = participantId !== senderId;
            const category = type === 'application' ? 'applications' : (type === 'notification' ? 'notifications' : 'inbox');
            await updateOrganisationConversation(participantId, conversationId, category, isRecipient, {
                lastMessageAt: mongodb_wrapper_1.Timestamp.now(),
                lastMessagePreview: initialMessage.content?.slice(0, 160) || '',
            });
            if (isRecipient) {
                const recipientOrgDoc = await mongodb_wrapper_1.organisationsCollection.doc(participantId).get();
                const recipientOrgData = recipientOrgDoc.data();
                if (recipientOrgData && recipientOrgData.contact?.email) {
                    if (type === 'application') {
                        await (0, email_1.sendApplicationEmail)(recipientOrgData.contact.email, recipientOrgData.name || recipientOrgData.nameLocal || 'Organization', senderOrgData?.name || 'Unknown Organization', metadata?.callTitle || 'Untitled Opportunity', metadata?.applicationType || 'call');
                    }
                    else if (type === 'direct') {
                        await (0, email_1.sendDirectMessageEmail)(recipientOrgData.contact.email, recipientOrgData.name || recipientOrgData.nameLocal || 'Organization', senderOrgData?.name || 'Unknown Organization', initialMessage.content);
                    }
                }
            }
        }
        res.json({
            success: true,
            data: { conversation }
        });
    }
    catch (error) {
        console.error("Create conversation error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create conversation"
        });
    }
});
router.get("/conversations", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const organisationId = req.user?.organisationId;
        const { category = 'inbox', page = '1', limit = '20', search } = req.query;
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
        const orgConvDocRef = organisationConversationsCollection.doc(organisationId);
        const orgConvDoc = await orgConvDocRef.get();
        const orgConvData = orgConvDoc.data();
        let conversations = [];
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
        const indexCol = orgConvDocRef.collection('conversations');
        const categoryMap = {
            inbox: ['inbox'],
            applications: ['applications'],
            starred: ['starred'],
            archived: ['archived'],
            notifications: ['notifications'],
        };
        const indexCategories = categoryMap[category] || ['inbox'];
        let indexQuery;
        if (indexCategories.length === 1) {
            indexQuery = indexCol.where('category', '==', indexCategories[0]).orderBy('lastMessageAt', 'desc').limit(limitNum);
        }
        else {
            indexQuery = indexCol.where('category', 'in', indexCategories).orderBy('lastMessageAt', 'desc').limit(limitNum);
        }
        const indexSnapshot = await indexQuery.get();
        if (!indexSnapshot.empty) {
            console.log(`[DEBUG] Found ${indexSnapshot.size} indexed conversations for org in category ${category}`);
            const paginated = indexSnapshot.docs;
            const convPromises = paginated.map(async (d) => {
                const convId = d.id;
                const convDoc = await conversationsCollection.doc(convId).get();
                if (!convDoc.exists)
                    return null;
                const convData = convDoc.data();
                if (search) {
                    const searchLower = search.toLowerCase();
                    const matchesSearch = convData.lastMessage?.content?.toLowerCase().includes(searchLower) ||
                        convData.metadata?.subject?.toLowerCase().includes(searchLower) ||
                        convData.participants.some((p) => p.toLowerCase().includes(searchLower));
                    if (!matchesSearch)
                        return null;
                }
                const indexData = d.data();
                const indexUnreadCount = indexData.unreadCount !== undefined ? indexData.unreadCount : null;
                const convUnreadCount = convData.unreadCounts?.[organisationId] || 0;
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
            conversations = convResults.filter(Boolean);
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
            }
            else {
                const allIndexSnapshot = await indexCol.orderBy('lastMessageAt', 'desc').limit(500).get();
                const counters = {
                    total: 0, inbox: 0, applications: 0, projects: 0, calls: 0, starred: 0, archived: 0, notifications: 0,
                };
                allIndexSnapshot.docs.forEach((d) => {
                    const data = d.data();
                    const unread = Number(data.unreadCount || 0);
                    counters.total += unread;
                    if (data.category && data.category in counters) {
                        counters[data.category] += unread;
                    }
                });
                unreadCounts = counters;
            }
        }
        else if (orgConvData?.conversations && Object.keys(orgConvData.conversations).length > 0) {
            console.log(`[DEBUG] Found ${Object.keys(orgConvData.conversations).length} conversations in orgConvData`);
            let conversationIds = Object.keys(orgConvData.conversations);
            conversationIds = conversationIds.filter(convId => orgConvData.conversations[convId]?.category === category);
            console.log(`[DEBUG] Filtered to ${conversationIds.length} conversations for category ${category}`);
            if (conversationIds.length > 0) {
                const startIdx = (pageNum - 1) * limitNum;
                const paginatedIds = conversationIds.slice(startIdx, startIdx + limitNum);
                const conversationPromises = paginatedIds.map(async (convId) => {
                    const convDoc = await conversationsCollection.doc(convId).get();
                    if (!convDoc.exists)
                        return null;
                    const convData = convDoc.data();
                    if (search) {
                        const searchLower = search.toLowerCase();
                        const matchesSearch = convData.lastMessage?.content?.toLowerCase().includes(searchLower) ||
                            convData.metadata?.subject?.toLowerCase().includes(searchLower) ||
                            convData.participants.some((p) => p.toLowerCase().includes(searchLower));
                        if (!matchesSearch)
                            return null;
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
        }
        else {
            console.log(`[DEBUG] No orgConvData found, querying conversations directly`);
            try {
                const conversationsQuery = conversationsCollection
                    .where('participants', 'array-contains', organisationId)
                    .limit(limitNum * 3);
                const conversationsSnapshot = await conversationsQuery.get();
                console.log(`[DEBUG] Found ${conversationsSnapshot.docs.length} conversations directly`);
                const allConversations = conversationsSnapshot.docs.map((doc) => {
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
                let filteredConversations = allConversations;
                if (category === 'inbox') {
                    filteredConversations = filteredConversations.filter((conv) => conv.type === 'direct');
                }
                else if (category === 'applications') {
                    filteredConversations = filteredConversations.filter((conv) => conv.type === 'application');
                }
                if (search) {
                    const searchLower = search.toLowerCase();
                    filteredConversations = filteredConversations.filter((conv) => conv.lastMessage?.content?.toLowerCase().includes(searchLower) ||
                        conv.metadata?.subject?.toLowerCase().includes(searchLower) ||
                        conv.participants.some((p) => p.toLowerCase().includes(searchLower)));
                }
                filteredConversations.sort((a, b) => {
                    const aTime = a.lastMessage?.timestamp?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
                    const bTime = b.lastMessage?.timestamp?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });
                const startIdx = (pageNum - 1) * limitNum;
                conversations = filteredConversations.slice(startIdx, startIdx + limitNum);
                const backfillBatch = mongodb_wrapper_1.db.batch();
                const computeCategory = (conv) => {
                    if (conv.isArchived)
                        return 'archived';
                    if (conv.isStarred)
                        return 'starred';
                    if (conv.type === 'notification')
                        return 'notifications';
                    if (conv.type === 'application')
                        return 'applications';
                    return 'inbox';
                };
                filteredConversations.slice(0, 50).forEach((conv) => {
                    const orgConvRef = organisationConversationsCollection.doc(organisationId);
                    const indexDocRef = orgConvRef.collection('conversations').doc(conv.id);
                    backfillBatch.set(indexDocRef, {
                        category: computeCategory(conv),
                        lastAccessed: mongodb_wrapper_1.Timestamp.now(),
                        lastMessageAt: conv.lastMessage?.timestamp || mongodb_wrapper_1.Timestamp.now(),
                        lastMessagePreview: conv.lastMessage?.content?.slice(0, 160) || '',
                        unreadCount: conv.unreadCount || 0,
                    }, { merge: true });
                });
                await backfillBatch.commit();
                unreadCounts = {
                    total: allConversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
                    inbox: allConversations.filter((conv) => conv.type !== 'notification' && !conv.isArchived).reduce((sum, conv) => sum + conv.unreadCount, 0),
                    applications: allConversations.filter((conv) => conv.type === 'application' && !conv.isArchived).reduce((sum, conv) => sum + conv.unreadCount, 0),
                    projects: 0,
                    calls: 0,
                    starred: allConversations.filter((conv) => conv.isStarred).reduce((sum, conv) => sum + conv.unreadCount, 0),
                    archived: allConversations.filter((conv) => conv.isArchived).reduce((sum, conv) => sum + conv.unreadCount, 0),
                    notifications: allConversations.filter((conv) => conv.type === 'notification' && !conv.isArchived).reduce((sum, conv) => sum + conv.unreadCount, 0)
                };
            }
            catch (fallbackError) {
                console.error(`[ERROR] Fallback query failed:`, fallbackError);
                conversations = [];
                unreadCounts = {
                    total: 0, inbox: 0, applications: 0, projects: 0, calls: 0,
                    starred: 0, archived: 0, notifications: 0
                };
            }
        }
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
    }
    catch (error) {
        console.error("Get conversations error:", error);
        console.error("Error details:", error.message);
        console.error("Stack trace:", error.stack);
        return res.status(500).json({
            success: false,
            error: `Failed to get conversations: ${error.message}`
        });
    }
});
router.get("/conversations/:id/messages", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const organisationId = req.user.organisationId;
        const { page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const convDoc = await conversationsCollection.doc(conversationId).get();
        if (!convDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Conversation not found"
            });
        }
        const convData = convDoc.data();
        if (!convData.participants.includes(organisationId)) {
            return res.status(403).json({
                success: false,
                error: "Access denied"
            });
        }
        const messagesRef = conversationsCollection.doc(conversationId).collection('messages');
        const messagesQuery = messagesRef
            .orderBy('createdAt', 'desc')
            .limit(limitNum);
        const messagesSnapshot = await messagesQuery.get();
        const skip = (pageNum - 1) * limitNum;
        const paginatedDocs = messagesSnapshot.docs.slice(skip, skip + limitNum);
        const messages = paginatedDocs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isRead: doc.data().isRead?.[organisationId] || false
        }));
        const unreadCount = convData.unreadCounts?.[organisationId] || 0;
        const category = convData.type === 'notification' ? 'notifications' :
            (convData.type === 'application' ? 'applications' : 'inbox');
        const orgConvRef = organisationConversationsCollection.doc(organisationId);
        const orgIndexRef = orgConvRef.collection('conversations').doc(conversationId);
        const indexDoc = await orgIndexRef.get();
        const indexData = indexDoc.data();
        const allMessagesQuery = messagesRef
            .orderBy('createdAt', 'desc')
            .limit(500);
        const allMessagesSnapshot = await allMessagesQuery.get();
        const batch = mongodb_wrapper_1.db.batch();
        let hasUpdates = false;
        let markedCount = 0;
        for (const doc of allMessagesSnapshot.docs) {
            const messageData = doc.data();
            if (!messageData.isRead?.[organisationId]) {
                const messageRef = conversationsCollection.doc(conversationId).collection('messages').doc(doc.id);
                batch.update(messageRef, {
                    [`isRead.${organisationId}`]: true
                });
                markedCount++;
                hasUpdates = true;
            }
        }
        if (unreadCount > 0 || markedCount > 0) {
            batch.update(conversationsCollection.doc(conversationId), {
                [`unreadCounts.${organisationId}`]: 0
            });
            hasUpdates = true;
        }
        const indexUpdate = {
            unreadCount: 0,
            lastAccessed: mongodb_wrapper_1.Timestamp.now(),
            category: category
        };
        if (indexData?.lastMessageAt) {
            indexUpdate.lastMessageAt = indexData.lastMessageAt;
        }
        else if (convData.lastMessage?.timestamp) {
            indexUpdate.lastMessageAt = convData.lastMessage.timestamp;
        }
        else {
            indexUpdate.lastMessageAt = mongodb_wrapper_1.Timestamp.now();
        }
        if (indexData?.lastMessagePreview) {
            indexUpdate.lastMessagePreview = indexData.lastMessagePreview;
        }
        else if (convData.lastMessage?.content) {
            indexUpdate.lastMessagePreview = convData.lastMessage.content.slice(0, 160);
        }
        batch.set(orgIndexRef, indexUpdate, { merge: true });
        hasUpdates = true;
        if (unreadCount > 0) {
            batch.update(orgConvRef, {
                [`conversations.${conversationId}.unreadCount`]: 0,
                totalUnreadCount: mongodb_wrapper_1.FieldValue.increment(-unreadCount),
                [`categories.${category}`]: mongodb_wrapper_1.FieldValue.increment(-unreadCount)
            });
        }
        else {
            batch.set(orgConvRef, {
                [`conversations.${conversationId}.unreadCount`]: 0,
            }, { merge: true });
        }
        if (hasUpdates || unreadCount > 0) {
            await batch.commit();
            console.log(`[DEBUG] Marked ${markedCount} messages as read for conversation ${conversationId}, updated unreadCount to 0`);
        }
        convData.unreadCounts = {
            ...convData.unreadCounts,
            [organisationId]: 0
        };
        const responseConversation = {
            id: conversationId,
            ...convData,
            unreadCount: convData.unreadCounts?.[organisationId] || 0
        };
        return res.json({
            success: true,
            data: {
                messages: messages.reverse(),
                conversation: responseConversation
            }
        });
    }
    catch (error) {
        console.error("Get messages error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to get messages"
        });
    }
});
router.post("/conversations/:id/messages", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const organisationId = req.user.organisationId;
        const { content, type = 'text', priority, metadata } = req.body;
        const convDoc = await conversationsCollection.doc(conversationId).get();
        if (!convDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Conversation not found"
            });
        }
        const convData = convDoc.data();
        if (!convData.participants.includes(organisationId)) {
            return res.status(403).json({
                success: false,
                error: "Access denied"
            });
        }
        const senderOrgDoc = await mongodb_wrapper_1.organisationsCollection.doc(organisationId).get();
        const senderOrgData = senderOrgDoc.data();
        const messageData = {
            senderId: organisationId,
            senderName: senderOrgData?.name || 'Unknown Organization',
            senderLogo: senderOrgData?.images?.logo || senderOrgData?.logo || '',
            content,
            type,
            priority: priority || 'medium',
            metadata: metadata || {},
            isRead: convData.participants.reduce((acc, id) => {
                acc[id] = id === organisationId;
                return acc;
            }, {}),
            createdAt: mongodb_wrapper_1.Timestamp.now()
        };
        const messageRef = await conversationsCollection.doc(conversationId)
            .collection('messages')
            .add(messageData);
        const batch = mongodb_wrapper_1.db.batch();
        batch.update(conversationsCollection.doc(conversationId), {
            lastMessage: {
                content,
                senderId: organisationId,
                timestamp: mongodb_wrapper_1.Timestamp.now(),
                type
            },
            updatedAt: mongodb_wrapper_1.Timestamp.now(),
            ...convData.participants.reduce((acc, id) => {
                if (id !== organisationId) {
                    acc[`unreadCounts.${id}`] = mongodb_wrapper_1.FieldValue.increment(1);
                }
                return acc;
            }, {})
        });
        for (const participantId of convData.participants) {
            if (participantId !== organisationId) {
                const orgConvRef = organisationConversationsCollection.doc(participantId);
                const category = convData.type === 'notification' ? 'notifications' :
                    (convData.type === 'application' ? 'applications' : 'inbox');
                const indexDocRef = orgConvRef.collection('conversations').doc(conversationId);
                batch.set(indexDocRef, {
                    category,
                    lastAccessed: mongodb_wrapper_1.Timestamp.now(),
                    lastMessageAt: mongodb_wrapper_1.Timestamp.now(),
                    lastMessagePreview: content?.slice(0, 160) || '',
                    unreadCount: mongodb_wrapper_1.FieldValue.increment(1),
                }, { merge: true });
                batch.set(orgConvRef, {
                    totalUnreadCount: mongodb_wrapper_1.FieldValue.increment(1),
                    [`categories.${category}`]: mongodb_wrapper_1.FieldValue.increment(1),
                }, { merge: true });
            }
        }
        await batch.commit();
        const recipientIds = convData.participants.filter((id) => id !== organisationId);
        for (const recipientId of recipientIds) {
            try {
                const recipientOrgDoc = await mongodb_wrapper_1.organisationsCollection.doc(recipientId).get();
                const recipientOrgData = recipientOrgDoc.data();
                if (recipientOrgData && recipientOrgData.contact?.email) {
                    const recipientName = recipientOrgData.name || recipientOrgData.nameLocal || 'Organization';
                    const senderName = senderOrgData?.name || 'Unknown Organization';
                    if (convData.type === 'application') {
                        await (0, email_1.sendApplicationEmail)(recipientOrgData.contact.email, recipientName, senderName, convData.metadata?.callTitle || 'Untitled Opportunity', convData.metadata?.applicationType || 'call');
                    }
                    else {
                        await (0, email_1.sendDirectMessageEmail)(recipientOrgData.contact.email, recipientName, senderName, content);
                    }
                }
            }
            catch (emailError) {
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
    }
    catch (error) {
        console.error("Send message error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to send message"
        });
    }
});
router.put("/conversations/:id/star", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const organisationId = req.user.organisationId;
        const { starred } = req.body;
        await conversationsCollection.doc(conversationId).update({
            [`isStarred.${organisationId}`]: starred
        });
        const category = starred ? 'starred' : 'inbox';
        await updateOrganisationConversation(organisationId, conversationId, category);
        res.json({
            success: true,
            data: { starred }
        });
    }
    catch (error) {
        console.error("Toggle star error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to toggle star"
        });
    }
});
router.put("/conversations/:id/archive", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const organisationId = req.user.organisationId;
        const { archived } = req.body;
        await conversationsCollection.doc(conversationId).update({
            [`isArchived.${organisationId}`]: archived
        });
        const category = archived ? 'archived' : 'inbox';
        await updateOrganisationConversation(organisationId, conversationId, category);
        res.json({
            success: true,
            data: { archived }
        });
    }
    catch (error) {
        console.error("Toggle archive error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to toggle archive"
        });
    }
});
router.get("/unread-count", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
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
    }
    catch (error) {
        console.error("Get unread count error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get unread count"
        });
    }
});
router.post("/notifications/activity", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const senderId = req.user.organisationId;
        const { recipientId, activityType, metadata } = req.body;
        if (!recipientId || !activityType) {
            return res.status(400).json({
                success: false,
                error: "recipientId and activityType are required"
            });
        }
        if (senderId === recipientId) {
            return res.json({
                success: true,
                data: { message: "No notification sent to self" }
            });
        }
        const senderOrgDoc = await mongodb_wrapper_1.organisationsCollection.doc(senderId).get();
        const senderOrgData = senderOrgDoc.data();
        if (!senderOrgData) {
            return res.status(404).json({
                success: false,
                error: "Sender organisation not found"
            });
        }
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
        const participantIds = [recipientId, senderId];
        const conversationId = generateConversationId(participantIds);
        const existingConv = await conversationsCollection.doc(conversationId).get();
        if (existingConv.exists) {
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
                }, {}),
                createdAt: mongodb_wrapper_1.Timestamp.now()
            };
            await conversationsCollection.doc(conversationId)
                .collection('messages')
                .add(messageData);
            await conversationsCollection.doc(conversationId).update({
                lastMessage: {
                    content: notificationContent,
                    senderId,
                    timestamp: mongodb_wrapper_1.Timestamp.now(),
                    type: 'notification'
                },
                updatedAt: mongodb_wrapper_1.Timestamp.now(),
                [`unreadCounts.${recipientId}`]: mongodb_wrapper_1.FieldValue.increment(1)
            });
            await updateOrganisationConversation(recipientId, conversationId, 'notifications', true);
        }
        else {
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
                    timestamp: mongodb_wrapper_1.Timestamp.now(),
                    type: 'notification'
                },
                unreadCounts: participantIds.reduce((acc, id) => {
                    acc[id] = id === senderId ? 0 : 1;
                    return acc;
                }, {}),
                isArchived: participantIds.reduce((acc, id) => {
                    acc[id] = false;
                    return acc;
                }, {}),
                isStarred: participantIds.reduce((acc, id) => {
                    acc[id] = false;
                    return acc;
                }, {}),
                createdAt: mongodb_wrapper_1.Timestamp.now(),
                updatedAt: mongodb_wrapper_1.Timestamp.now()
            };
            await conversationsCollection.doc(conversationId).set(conversationData);
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
                }, {}),
                createdAt: mongodb_wrapper_1.Timestamp.now()
            };
            await conversationsCollection.doc(conversationId)
                .collection('messages')
                .add(messageData);
            await updateOrganisationConversation(recipientId, conversationId, 'notifications', true);
            await updateOrganisationConversation(senderId, conversationId, 'notifications', false);
        }
        return res.json({
            success: true,
            data: { message: 'Notification created successfully' }
        });
    }
    catch (error) {
        console.error("Create activity notification error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to create activity notification"
        });
    }
});
router.get("/test", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        return res.json({
            success: true,
            data: {
                message: "Messaging API is working",
                organisationId: req.user?.organisationId,
                user: req.user
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.get("/debug/conversations", auth_1.authenticateToken, auth_1.requireOrganisation, async (req, res) => {
    try {
        const organisationId = req.user?.organisationId;
        console.log(`[DEBUG] Debug endpoint called for org: ${organisationId}`);
        const allConversationsQuery = conversationsCollection.orderBy('updatedAt', 'desc').limit(10);
        const allConversationsSnapshot = await allConversationsQuery.get();
        const allConversations = allConversationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            participants: doc.data().participants,
            type: doc.data().type,
            lastMessage: doc.data().lastMessage
        }));
        const userConversationsQuery = conversationsCollection
            .where('participants', 'array-contains', organisationId)
            .limit(10);
        const userConversationsSnapshot = await userConversationsQuery.get();
        const userConversations = userConversationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        const orgConvDoc = await organisationConversationsCollection.doc(organisationId || 'unknown').get();
        const orgConvData = orgConvDoc.data();
        const participantMatches = allConversations.filter((conv) => conv.participants && organisationId && conv.participants.includes(organisationId));
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
    }
    catch (error) {
        console.error("Debug conversations error:", error);
        return res.status(500).json({
            success: false,
            error: `Failed to debug conversations: ${error.message}`
        });
    }
});
exports.default = router;
//# sourceMappingURL=messaging.js.map