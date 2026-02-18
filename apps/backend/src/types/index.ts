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
    numberOfStaff?: number | string;
    numberOfVolunteers?: number | string;
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
    passwordHash?: string;
    firebaseUid?: string;
    // Login tracking
    lastLoginAt?: Date;
    loginCount?: number;
    // Suspension fields
    suspendedAt?: Date;
    suspensionReason?: string;
    suspendedByAdminId?: string;
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

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: "admin" | "super_admin";
    createdAt: Date;
    lastLoginAt?: Date;
    loginCount?: number;
    passwordHash?: string;
    firebaseUid?: string;
}

export interface AuthUser {
    id: string;
    email: string;
    organisationId?: string;
    role: "organisation" | "admin" | "super_admin";
}

export interface SuperAdminLoginRequest {
    email: string;
    password: string;
}

export interface OrganisationListResponse {
    organisations: (Organisation & { id: string })[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SuspendOrganisationRequest {
    reason: string;
}

// Opportunity models (backend uses Firestore Timestamps for dates)
export type OpportunityType = "call" | "project";

export interface OpportunityOrganisation {
    id: string;
    name: string;
    logo?: string;
}

export interface OpportunityBudget {
    min: number;
    max: number;
    currency: string;
}

export interface OpportunityBase<TDate = Date> {
    id: string;
    type: OpportunityType;
    title: string;
    description: string;
    organisation: OpportunityOrganisation;
    budget: OpportunityBudget;
    deadline: TDate;
    location: string;
    thematicAreas: string[];
    requiredExpertise: string[];
    projectDuration?: string;
    maxPartners?: number;
    status: "active" | "closed" | "draft";
    createdAt: TDate;
    updatedAt?: TDate;
    applicationsCount: number;
    createdByUserId?: string;
    createdByOrganisationId?: string;
    visibility?: "public" | "members";
}

export interface CallSpecific<TDate = Date> {
    shortDescription?: string;
    callType?: string;
    eligibleRegions?: string[];
    openingDate?: TDate;
    evaluationPeriod?: string;
    expectedStartDate?: TDate;
    eligibilityCriteria?: string;
    numberOfAwards?: number;
    applicationLink?: string;
    requiredDocuments?: string[];
    contact?: { name?: string; email?: string; phone?: string };
    guidelinePdfUrl?: string;
    faqLink?: string;
}

export interface ProjectSpecific<TDate = Date> {
    shortSummary?: string;
    category?: string;
    tags?: string[];
    startDate?: TDate;
    endDate?: TDate;
    ongoing?: boolean;
    projectStatus?: "planned" | "ongoing" | "completed";
    leadOrganisationId?: string;
    leadOrganisationName?: string;
    partnerOrganisationNames?: string[];
    fundingSource?: string;
    budgetVisibility?: "public" | "private";
    outcomes?: string;
    galleryUrls?: string[];
    videoUrls?: string[];
    reportUrls?: string[];
    projectManager?: { name?: string; email?: string; phone?: string };
    website?: string;
}

export type Opportunity<TDate = Date> = OpportunityBase<TDate> & CallSpecific<TDate> & ProjectSpecific<TDate>;

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface ReviewRequest {
    action: "approve" | "decline";
    feedback?: string;
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
    numberOfStaff?: number | string;
    numberOfVolunteers?: number | string;
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