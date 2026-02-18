// Frontend Opportunity model (dates as JS Date)

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

export interface OpportunityBase {
    id: string;
    type: OpportunityType;
    title: string;
    description: string; // full description
    organisation: OpportunityOrganisation;
    budget: OpportunityBudget;
    deadline: Date;
    location: string;
    thematicAreas: string[];
    requiredExpertise: string[];
    projectDuration?: string;
    maxPartners?: number;
    status: "active" | "closed" | "draft";
    createdAt: Date;
    updatedAt?: Date;
    applicationsCount: number;
    createdByUserId?: string;
    createdByOrganisationId?: string;
    visibility?: "public" | "members";
}

export interface CallSpecific {
    shortDescription?: string;
    callType?: string;
    eligibleRegions?: string[];
    openingDate?: Date;
    evaluationPeriod?: string;
    expectedStartDate?: Date;
    eligibilityCriteria?: string;
    numberOfAwards?: number;
    applicationLink?: string;
    requiredDocuments?: string[];
    contact?: { name?: string; email?: string; phone?: string };
    guidelinePdfUrl?: string;
    faqLink?: string;
}

export interface ProjectSpecific {
    shortSummary?: string;
    category?: string;
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
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

export type Opportunity = OpportunityBase & CallSpecific & ProjectSpecific;


