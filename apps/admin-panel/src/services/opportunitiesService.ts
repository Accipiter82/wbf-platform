import axios from 'axios';

// Get API base URL from environment or use default
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

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

export interface Opportunity {
    id: string;
    type: OpportunityType;
    title: string;
    description: string;
    organisation: OpportunityOrganisation;
    budget: OpportunityBudget;
    deadline: Date | string; // Can be Date or ISO string
    location: string;
    thematicAreas: string[];
    requiredExpertise: string[];
    projectDuration?: string;
    maxPartners?: number;
    status: "active" | "closed" | "draft";
    createdAt: Date | string;
    updatedAt?: Date | string;
    applicationsCount: number;
    createdByUserId?: string;
    createdByOrganisationId?: string;
    // Call-specific optional fields
    shortDescription?: string;
    callType?: string;
    eligibleRegions?: string[];
    openingDate?: Date | string;
    evaluationPeriod?: string;
    expectedStartDate?: Date | string;
    eligibilityCriteria?: string;
    numberOfAwards?: number;
    applicationLink?: string;
    requiredDocuments?: string[];
    contact?: { name?: string; email?: string; phone?: string };
    guidelinePdfUrl?: string;
    faqLink?: string;
    visibility?: "public" | "members";
    // Project-specific optional fields
    shortSummary?: string;
    category?: string;
    tags?: string[];
    startDate?: Date | string;
    endDate?: Date | string;
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

export interface CreateOpportunityInput {
    type: OpportunityType;
    title: string;
    description: string;
    shortDescription?: string;
    shortSummary?: string;
    organisation: OpportunityOrganisation;
    budget: OpportunityBudget;
    deadline: Date;
    location: string;
    thematicAreas: string[];
    requiredExpertise: string[];
    projectDuration?: string;
    maxPartners?: number;
    status?: "active" | "closed" | "draft";
    createdByUserId?: string;
    createdByOrganisationId?: string;
    // Call-specific optional fields
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
    visibility?: "public" | "members";
    // Project-specific optional fields
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

export interface ApplicationInput {
    opportunityId: string;
    message: string;
    applicantUserId: string;
    applicantOrganisationId?: string;
    applicantName?: string;
    applicantEmail?: string;
}

export type SortOption =
    | "deadline-asc"
    | "deadline-desc"
    | "title-asc"
    | "title-desc"
    | "created-desc"
    | "created-asc"
    | "budget-asc"
    | "budget-desc";

export interface OpportunityFilters {
    includeFinished?: boolean;
    status?: ("active" | "closed" | "draft")[];
    type?: ("call" | "project")[];
    thematicAreas?: string[];
    locations?: string[];
    budgetMin?: number;
    budgetMax?: number;
    deadlineFrom?: Date;
    deadlineTo?: Date;
    searchTerm?: string;
}

export interface PaginatedOpportunities {
    opportunities: Opportunity[];
    hasMore: boolean;
    lastDoc?: any; // For compatibility, but not used with API
    total: number;
}

// Helper to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
}

// Convert date strings to Date objects
function convertDates(opportunity: any): Opportunity {
    const convertDate = (date: any): Date | undefined => {
        if (!date) return undefined;
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        if (date.seconds) return new Date(date.seconds * 1000);
        return undefined;
    };

    return {
        ...opportunity,
        deadline: convertDate(opportunity.deadline) || new Date(),
        createdAt: convertDate(opportunity.createdAt) || new Date(),
        updatedAt: convertDate(opportunity.updatedAt),
        openingDate: convertDate(opportunity.openingDate),
        expectedStartDate: convertDate(opportunity.expectedStartDate),
        startDate: convertDate(opportunity.startDate),
        endDate: convertDate(opportunity.endDate),
    } as Opportunity;
}

/**
 * Subscribe to opportunities (using polling instead of real-time)
 */
export function subscribeToOpportunities(
    callback: (items: Opportunity[]) => void
): () => void {
    let intervalId: NodeJS.Timeout;
    let isActive = true;

    const fetchOpportunities = async () => {
        if (!isActive) return;
        try {
            const response = await axios.get(
                `${API_BASE_URL}/super-admin/calls-projects`,
                { headers: getAuthHeaders() }
            );
            if (response.data.success) {
                const opportunities = response.data.data.opportunities.map(convertDates);
                callback(opportunities);
            }
        } catch (error) {
            console.error('Error fetching opportunities:', error);
        }
    };

    // Initial fetch
    fetchOpportunities();

    // Poll every 30 seconds
    intervalId = setInterval(fetchOpportunities, 30000);

    // Return unsubscribe function
    return () => {
        isActive = false;
        if (intervalId) clearInterval(intervalId);
    };
}

/**
 * Get paginated opportunities
 */
export async function getOpportunitiesPaginated(
    pageSize: number = 10,
    sortBy: SortOption = "deadline-asc",
    filters: OpportunityFilters = {},
    lastDoc?: any
): Promise<PaginatedOpportunities> {
    try {
        const params: any = {
            page: lastDoc ? (lastDoc.page || 1) + 1 : 1,
            limit: pageSize,
            sortBy,
            includeFinished: filters.includeFinished ? 'true' : 'false',
        };

        if (filters.status && filters.status.length > 0) {
            params.status = filters.status.join(',');
        }

        if (filters.type && filters.type.length > 0) {
            params.type = filters.type.join(',');
        }

        if (filters.searchTerm) {
            params.searchTerm = filters.searchTerm;
        }

        if (filters.thematicAreas && filters.thematicAreas.length > 0) {
            params.thematicAreas = filters.thematicAreas.join(',');
        }

        if (filters.locations && filters.locations.length > 0) {
            params.locations = filters.locations.join(',');
        }

        if (filters.budgetMin !== undefined) {
            params.budgetMin = filters.budgetMin.toString();
        }

        if (filters.budgetMax !== undefined) {
            params.budgetMax = filters.budgetMax.toString();
        }

        if (filters.deadlineFrom) {
            params.deadlineFrom = filters.deadlineFrom.toISOString();
        }

        if (filters.deadlineTo) {
            params.deadlineTo = filters.deadlineTo.toISOString();
        }

        const response = await axios.get(
            `${API_BASE_URL}/super-admin/calls-projects`,
            {
                params,
                headers: getAuthHeaders(),
            }
        );

        if (response.data.success) {
            const opportunities = response.data.data.opportunities.map(convertDates);
            const pagination = response.data.data.pagination;

            return {
                opportunities,
                hasMore: pagination.page < pagination.totalPages,
                total: pagination.total,
            };
        }

        throw new Error('Failed to fetch opportunities');
    } catch (error: any) {
        console.error('Error fetching opportunities:', error);
        throw error;
    }
}

/**
 * Create a new opportunity
 */
export async function createOpportunity(input: CreateOpportunityInput): Promise<string> {
    try {
        // Prepare the payload - convert dates to ISO strings
        const payload: any = {
            organisationId: input.organisation.id,
            type: input.type,
            title: input.title,
            description: input.description,
            budget: input.budget,
            deadline: input.deadline instanceof Date ? input.deadline.toISOString() : input.deadline,
            location: input.location,
            thematicAreas: input.thematicAreas || [],
            requiredExpertise: input.requiredExpertise || [],
            status: input.status || 'active',
        };

        // Add optional fields only if they exist
        if (input.shortDescription) payload.shortDescription = input.shortDescription;
        if (input.shortSummary) payload.shortSummary = input.shortSummary;
        if (input.projectDuration) payload.projectDuration = input.projectDuration;
        if (input.maxPartners !== undefined) payload.maxPartners = input.maxPartners;
        
        // Call-specific fields
        if (input.callType) payload.callType = input.callType;
        if (input.eligibleRegions) payload.eligibleRegions = input.eligibleRegions;
        if (input.openingDate) payload.openingDate = input.openingDate instanceof Date ? input.openingDate.toISOString() : input.openingDate;
        if (input.evaluationPeriod) payload.evaluationPeriod = input.evaluationPeriod;
        if (input.expectedStartDate) payload.expectedStartDate = input.expectedStartDate instanceof Date ? input.expectedStartDate.toISOString() : input.expectedStartDate;
        if (input.eligibilityCriteria) payload.eligibilityCriteria = input.eligibilityCriteria;
        if (input.numberOfAwards !== undefined) payload.numberOfAwards = input.numberOfAwards;
        if (input.applicationLink) payload.applicationLink = input.applicationLink;
        if (input.requiredDocuments) payload.requiredDocuments = input.requiredDocuments;
        if (input.contact) payload.contact = input.contact;
        if (input.guidelinePdfUrl) payload.guidelinePdfUrl = input.guidelinePdfUrl;
        if (input.faqLink) payload.faqLink = input.faqLink;
        if (input.visibility) payload.visibility = input.visibility;
        
        // Project-specific fields
        if (input.category) payload.category = input.category;
        if (input.tags) payload.tags = input.tags;
        if (input.startDate) payload.startDate = input.startDate instanceof Date ? input.startDate.toISOString() : input.startDate;
        if (input.endDate) payload.endDate = input.endDate instanceof Date ? input.endDate.toISOString() : input.endDate;
        if (input.ongoing !== undefined) payload.ongoing = input.ongoing;
        if (input.projectStatus) payload.projectStatus = input.projectStatus;
        if (input.leadOrganisationId) payload.leadOrganisationId = input.leadOrganisationId;
        if (input.leadOrganisationName) payload.leadOrganisationName = input.leadOrganisationName;
        if (input.partnerOrganisationNames) payload.partnerOrganisationNames = input.partnerOrganisationNames;
        if (input.fundingSource) payload.fundingSource = input.fundingSource;
        if (input.budgetVisibility) payload.budgetVisibility = input.budgetVisibility;
        if (input.outcomes) payload.outcomes = input.outcomes;
        if (input.galleryUrls) payload.galleryUrls = input.galleryUrls;
        if (input.videoUrls) payload.videoUrls = input.videoUrls;
        if (input.reportUrls) payload.reportUrls = input.reportUrls;
        if (input.projectManager) payload.projectManager = input.projectManager;
        if (input.website) payload.website = input.website;

        const response = await axios.post(
            `${API_BASE_URL}/super-admin/calls-projects`,
            payload,
            { headers: getAuthHeaders() }
        );

        if (response.data.success) {
            return response.data.data.opportunity.id;
        }

        throw new Error(response.data.error || 'Failed to create opportunity');
    } catch (error: any) {
        console.error('Error creating opportunity:', error);
        throw error;
    }
}

/**
 * Apply to an opportunity
 */
export async function applyToOpportunity(input: ApplicationInput): Promise<void> {
    try {
        // This would need a backend endpoint for applications
        // For now, we'll use messaging to send an application message
        const response = await axios.post(
            `${API_BASE_URL}/messaging/conversations`,
            {
                participantIds: [input.applicantOrganisationId || ''],
                type: 'application',
                subject: `Application for opportunity`,
                initialMessage: {
                    content: input.message,
                    type: 'application',
                    priority: 'high',
                    metadata: {
                        opportunityId: input.opportunityId,
                        applicantUserId: input.applicantUserId,
                        applicantOrganisationId: input.applicantOrganisationId,
                        applicantName: input.applicantName,
                        applicantEmail: input.applicantEmail,
                    },
                },
                metadata: {
                    callId: input.opportunityId,
                    applicationType: 'call',
                },
            },
            { headers: getAuthHeaders() }
        );

        if (!response.data.success) {
            throw new Error('Failed to submit application');
        }
    } catch (error: any) {
        console.error('Error applying to opportunity:', error);
        throw error;
    }
}

/**
 * Update an opportunity
 */
export async function updateOpportunity(
    organisationId: string,
    opportunityId: string,
    data: Partial<Omit<CreateOpportunityInput, "deadline"> & { deadline?: Date; status?: "active" | "closed" | "draft" }>
): Promise<void> {
    try {
        const updateData: any = { ...data };
        if (data.deadline) {
            updateData.deadline = data.deadline.toISOString();
        }

        const response = await axios.patch(
            `${API_BASE_URL}/super-admin/calls-projects/${organisationId}/${opportunityId}`,
            updateData,
            { headers: getAuthHeaders() }
        );

        if (!response.data.success) {
            throw new Error('Failed to update opportunity');
        }
    } catch (error: any) {
        console.error('Error updating opportunity:', error);
        throw error;
    }
}

/**
 * Delete an opportunity (soft delete by setting status to closed)
 */
export async function deleteOpportunity(organisationId: string, opportunityId: string): Promise<void> {
    try {
        await updateOpportunity(organisationId, opportunityId, { status: 'closed' });
    } catch (error: any) {
        console.error('Error deleting opportunity:', error);
        throw error;
    }
}

