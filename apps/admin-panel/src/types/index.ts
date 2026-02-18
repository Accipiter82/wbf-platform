export interface Organisation {
    id: string;
    name: string;
    nameLocal?: string;
    status: "draft" | "pending" | "approved" | "declined" | "suspended";
    createdAt?: any;
    updatedAt?: any;
    // Contact fields (flattened)
    contactEmail?: string;
    contactPhone?: string;
    contactPersonName?: string;
    contactPersonPosition?: string;
    // Location fields (flattened)  
    city?: string;
    postalAddress?: string;
    // Login tracking
    lastLoginAt?: any;
    loginCount?: number;
    // Suspension fields
    suspendedAt?: any;
    suspensionReason?: string;
    suspendedByAdminId?: string;
    images: {
        cover: string;
        logo: string;
    };
    contact: {
        email: string;
        phone: string;
        personName: string;
        personPosition: string;
        address: string;
        website: string;
        socialMedia: string[];
    };
    profile: {
        city: string;
        country: string;
        contractingParty: string;
        registrationNumber: string;
        yearOfEstablishment: number;
        numberOfStaff: number | null;
        numberOfVolunteers: number | string | null;
        profileCompleted: boolean;
        profileCompletedAt?: any;
        approvedAt?: any;
    };
    fields: {
        missionFields: string[];
        keywords: string[];
        availableResources: string[];
        expertiseOffered: string[];
        expertiseSought: string[];
        preferredRole: string[];
        geographicalCoverage: string[];
        lookingForPartnersFromCPs: string[];
        lookingForPartnersInThematicAreas: string[];
    };
    projects: any[];
    calls?: any[];
    wbfCallsApplied: any[];
    successStories: any[];
    referenceProjects: any[];
    roleInPastApplications: ("Lead" | "Partner")[];
    type: string;
}

export interface OrganisationDraft {
    name: string;
    email: string;
    phone: string;
    emailVerified: boolean;
    phoneVerified: boolean;
}

export interface OrganisationProfile {
    description: string;
    logo?: string;
    sectors: string[];
    country: string;
    city?: string;
    website?: string;
}

export interface User {
    id: string;
    email: string;
    organisationId?: string;
    role: "organisation" | "admin" | "super_admin";
}

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: "admin" | "super_admin";
    createdAt: Date;
    lastLoginAt?: Date;
    loginCount?: number;
}

export interface SuperAdminLoginRequest {
    email: string;
    password: string;
}

export interface DashboardStats {
    totalOrganisations: number;
    activeOrganisations: number;
    suspendedOrganisations: number;
    pendingOrganisations: number;
    draftOrganisations: number;
    recentLogins: number;
}

export interface SuspendOrganisationRequest {
    reason: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface LoginRequest {
    contactEmail: string;
    password: string;
}

export interface RegisterStep1Request {
    name: string;
    nameLocal: string;
    contractingParty: string;
    city: string;
    postalAddress: string;
    type: string;
    yearOfEstablishment: number;
    registrationNumber?: string;
    numberOfStaff?: number;
    numberOfVolunteers?: number;
    missionFields?: string[];
    website?: string;
    socialMediaProfiles?: string[];
    contactPersonName: string;
    contactPersonPosition?: string;
    contactEmail: string;
    contactPhone?: string;
}

export interface RegisterStep2Request {
    wbfCallsApplied?: { callNumber: string; year: number }[];
    roleInPastApplications?: ("Lead" | "Partner")[];
    projectTitles?: string[];
    projectDescriptions?: string[];
    projectThematicAreas?: string[];
    geographicalCoverage?: string[];
    lookingForPartnersInThematicAreas?: string[];
    lookingForPartnersFromCPs?: string[];
    preferredRole?: ("Lead" | "Partner" | "Either")[];
    expertiseOffered?: string[];
    expertiseSought?: string[];
    keywords?: string[];
    availableResources?: string[];
    referenceProjects?: string[];
    successStories?: string[];
    logo?: string;
}

export interface ReviewRequest {
    action: "approve" | "decline";
    feedback?: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}

export interface OrganisationsResponse {
    organisations: Organisation[];
    pagination: PaginationInfo;
}

export interface Stats {
    draft: number;
    pending: number;
    approved: number;
    declined: number;
    total: number;
}

export interface AuthState {
    user: User | null;
    organisation: Organisation | null;
    admin: AdminUser | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

// Wall Post Types
export interface WallPost {
    id: string;
    organisationId: string;
    organisationName: string;
    organisationLogo?: string;
    content: string;
    type: 'status' | 'announcement' | 'project_update' | 'general' | 'partnership';
    attachments?: string[];
    imageUrl?: string;
    reactions: PostReaction[];
    comments: PostComment[];
    createdAt: any;
    updatedAt: any;
}

export interface PostReaction {
    id: string;
    organisationId: string;
    organisationName: string;
    organisationLogo?: string;
    type: 'like' | 'fire' | 'great' | 'wow' | 'love' | 'thumbs_up';
    createdAt: any;
}

export interface PostComment {
    id: string;
    organisationId: string;
    organisationName: string;
    organisationLogo?: string;
    content: string;
    createdAt: any;
    updatedAt: any;
}

export interface CreateWallPostRequest {
    content: string;
    type: 'status' | 'announcement' | 'project_update' | 'general' | 'partnership';
    attachments?: string[];
    imageUrl?: string;
}

export interface AddReactionRequest {
    postId: string;
    type: 'like' | 'fire' | 'great' | 'wow' | 'love' | 'thumbs_up';
}

export interface AddCommentRequest {
    postId: string;
    content: string;
}

export interface WallPostsResponse {
    posts: WallPost[];
    pagination: PaginationInfo;
} 