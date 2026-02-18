import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface Conversation {
    id: string;
    participants: string[];
    participantNames?: Record<string, string>;
    type: 'direct' | 'application' | 'notification';
    metadata: {
        callId?: string;
        projectId?: string;
        applicationType?: 'call' | 'project';
        subject?: string;
        callTitle?: string;
        createdByOrganisationId?: string;
        activityType?: 'profile_view' | 'call_like' | 'project_like' | 'call_application' | 'project_application';
    };
    lastMessage: {
        content: string;
        senderId: string;
        timestamp: any;
        type: 'text' | 'application' | 'notification';
        priority?: 'low' | 'medium' | 'high';
    };
    unreadCount: number;
    isArchived: boolean;
    isStarred: boolean;
    createdAt: any;
    updatedAt: any;
}

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderLogo?: string;
    content: string;
    type: 'text' | 'application' | 'notification' | 'system';
    priority: 'low' | 'medium' | 'high';
    metadata?: any;
    isRead: boolean;
    createdAt: any;
}

export interface CreateConversationRequest {
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
        callTitle?: string;
        createdByOrganisationId?: string;
        activityType?: 'profile_view' | 'call_like' | 'project_like' | 'call_application' | 'project_application';
    };
}

export interface SendMessageRequest {
    content: string;
    type?: 'text' | 'application' | 'notification' | 'system';
    priority?: 'low' | 'medium' | 'high';
    metadata?: any;
}

export interface GetConversationsParams {
    category?: 'inbox' | 'applications' | 'projects' | 'calls' | 'starred' | 'archived' | 'notifications';
    page?: number;
    limit?: number;
    search?: string;
}

export interface ConversationsResponse {
    conversations: Conversation[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    unreadCounts: {
        total: number;
        inbox: number;
        applications: number;
        projects: number;
        calls: number;
        starred: number;
        archived: number;
        notifications: number;
    };
}

export interface MessagesResponse {
    messages: Message[];
    conversation: Conversation;
}

export interface UnreadCountResponse {
    totalUnreadCount: number;
    categories: {
        inbox: number;
        applications: number;
        projects: number;
        calls: number;
        starred: number;
        archived: number;
        notifications: number;
    };
}

export interface OrganisationSummary {
    id: string;
    name: string;
    logo?: string;
    description?: string;
    city?: string;
    country?: string;
    website?: string;
    email?: string;
    missionFields?: string[];
    organisationType?: string;
}

export interface OrganisationsResponse {
    organisations: OrganisationSummary[];
}

class MessagingService {
    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    async createConversation(data: CreateConversationRequest): Promise<{ conversation: Conversation }> {
        const response = await axios.post(
            `${API_BASE_URL}/messaging/conversations`,
            data,
            { headers: this.getAuthHeaders() }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to create conversation');
        }

        return response.data.data;
    }

    async getConversations(params: GetConversationsParams = {}): Promise<ConversationsResponse> {
        const queryParams = new URLSearchParams();

        if (params.category) queryParams.append('category', params.category);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);

        const response = await axios.get(
            `${API_BASE_URL}/messaging/conversations?${queryParams.toString()}`,
            { headers: this.getAuthHeaders() }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to fetch conversations');
        }

        return response.data.data;
    }

    async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<MessagesResponse> {
        // If conversationId is missing or undefined, return empty response immediately to prevent 404s
        if (!conversationId || conversationId === 'undefined') {
            console.warn('[MessagingService] getMessages called with invalid ID:', conversationId);
            return {
                messages: [],
                conversation: {} as Conversation // Return minimal empty object
            };
        }

        const response = await axios.get(
            `${API_BASE_URL}/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
            { headers: this.getAuthHeaders() }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to fetch messages');
        }

        return response.data.data;
    }

    async sendMessage(conversationId: string, data: SendMessageRequest): Promise<{ message: Message }> {
        const response = await axios.post(
            `${API_BASE_URL}/messaging/conversations/${conversationId}/messages`,
            {
                type: 'text',
                ...data,
            },
            { headers: this.getAuthHeaders() }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to send message');
        }

        return response.data.data;
    }

    async toggleStar(conversationId: string, starred: boolean): Promise<void> {
        const response = await axios.put(
            `${API_BASE_URL}/messaging/conversations/${conversationId}/star`,
            { starred },
            { headers: this.getAuthHeaders() }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to toggle star');
        }
    }

    async toggleArchive(conversationId: string, archived: boolean): Promise<void> {
        const response = await axios.put(
            `${API_BASE_URL}/messaging/conversations/${conversationId}/archive`,
            { archived },
            { headers: this.getAuthHeaders() }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to toggle archive');
        }
    }

    async getUnreadCount(): Promise<UnreadCountResponse> {
        const response = await axios.get(
            `${API_BASE_URL}/messaging/unread-count`,
            { headers: this.getAuthHeaders() }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to get unread count');
        }

        return response.data.data;
    }



    // Get all organizations for messaging
    async getAllOrganisations(search?: string): Promise<OrganisationsResponse> {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        queryParams.append('limit', '100'); // Get more for better selection

        const response = await axios.get(
            `${API_BASE_URL}/organisation/all?${queryParams.toString()}`,
            { headers: this.getAuthHeaders() }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to fetch organisations');
        }

        return response.data.data;
    }

    // Helper method to create direct message
    async createDirectMessage(
        recipientId: string,
        subject: string,
        content: string
    ): Promise<{ conversation: Conversation }> {
        return this.createConversation({
            participantIds: [recipientId],
            type: 'direct',
            subject,
            initialMessage: {
                content,
                type: 'text',
                priority: 'medium',
            },
        });
    }

    async createApplicationMessage(
        recipientId: string,
        callId: string,
        callTitle: string,
        applicationType: 'call' | 'project',
        message: string
    ): Promise<{ conversation: Conversation }> {
        return this.createConversation({
            participantIds: [recipientId],
            type: 'application',
            subject: `Application for ${callTitle}`,
            metadata: {
                callId,
                callTitle,
                applicationType,
                createdByOrganisationId: recipientId, // The call/project owner
            },
            initialMessage: {
                content: message,
                type: 'application',
                priority: 'high',
                metadata: {
                    callId,
                    callTitle,
                    applicationType,
                },
            },
        });
    }

    async createNotificationMessage(
        recipientId: string,
        subject: string,
        content: string,
        metadata?: any
    ): Promise<{ conversation: Conversation }> {
        return this.createConversation({
            participantIds: [recipientId],
            type: 'notification',
            subject,
            metadata,
            initialMessage: {
                content,
                type: 'notification',
                priority: 'medium',
                metadata,
            },
        });
    }

    // Helper method to create notification
    async createNotification(
        recipientId: string,
        title: string,
        content: string,
        metadata?: any
    ): Promise<{ conversation: Conversation }> {
        return this.createConversation({
            participantIds: [recipientId],
            type: 'notification',
            subject: title,
            metadata,
            initialMessage: {
                content,
                type: 'notification',
                priority: 'medium',
                metadata,
            },
        });
    }

    // Create activity notification (profile views, likes, etc.)
    async createActivityNotification(
        recipientId: string,
        activityType: 'profile_view' | 'call_like' | 'project_like' | 'call_application' | 'project_application',
        metadata?: any
    ): Promise<void> {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/messaging/notifications/activity`,
                {
                    recipientId,
                    activityType,
                    metadata
                },
                { headers: this.getAuthHeaders() }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to create activity notification');
            }
        } catch (error: any) {
            // Don't throw errors for notifications as they shouldn't break the main flow
            console.warn('Failed to create activity notification:', error.message);
        }
    }
}

export const messagingService = new MessagingService();
export default messagingService;
