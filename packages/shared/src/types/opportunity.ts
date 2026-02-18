// Shared Opportunity model (backend/frontend). Backend stores Firestore Timestamps; frontend maps to Date.

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

export interface OpportunityBase<TDate = any> {
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

export interface CallSpecific<TDate = any> {
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

export interface ProjectSpecific<TDate = any> {
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

export type Opportunity<TDate = any> = OpportunityBase<TDate> & CallSpecific<TDate> & ProjectSpecific<TDate>;


