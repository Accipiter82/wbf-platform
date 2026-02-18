export interface Organisation {
    // Organisational Profile
    id: string;
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

    // Contact Information
    contactPersonName: string;
    contactPersonPosition?: string;
    contactEmail: string;
    contactPhone?: string;

    // Projects & Proposal History
    wbfCallsApplied?: { callNumber: string; year: number }[];
    roleInPastApplications?: ("Lead" | "Partner")[];
    projectTitles?: string[];
    projectDescriptions?: string[];
    projectThematicAreas?: string[];
    geographicalCoverage?: string[];

    // Partnership Interests
    lookingForPartnersInThematicAreas?: string[];
    lookingForPartnersFromCPs?: string[];
    preferredRole?: ("Lead" | "Partner" | "Either")[];
    expertiseOffered?: string[];
    expertiseSought?: string[];

    // Additional Features
    keywords?: string[];
    availableResources?: string[];
    referenceProjects?: string[];
    successStories?: string[];

    // System fields
    logo?: string;
    cover?: string;
    status: "draft" | "pending" | "approved" | "declined" | "suspended";
    createdAt: Date;
    updatedAt: Date;
    emailVerified: boolean;
    phoneVerified: boolean;
    feedback?: string;
    adminId?: string;
    reviewedAt?: Date;
    // Login tracking
    lastLoginAt?: Date;
    loginCount?: number;
    // Suspension fields
    suspendedAt?: Date;
    suspensionReason?: string;
    suspendedByAdminId?: string;
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

export interface OrganisationListResponse {
    organisations: (Organisation & { id: string })[];
    pagination: PaginationInfo;
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

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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