import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface OpportunityResponse {
    opportunities: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface GetOpportunitiesParams {
    type?: 'call' | 'project';
    page?: number;
    limit?: number;
}

export interface GetAllOpportunitiesParams extends GetOpportunitiesParams {
    sortBy?: string;
    status?: string[];
    searchTerm?: string;
    thematicAreas?: string[];
    locations?: string[];
    budgetMin?: number;
    budgetMax?: number;
    includeFinished?: boolean;
    organisationId?: string;
}

export const opportunityService = {
    // Get current organization's opportunities (calls and projects)
    async getMyOpportunities(params: GetOpportunitiesParams = {}): Promise<OpportunityResponse> {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const queryParams = new URLSearchParams();
        if (params.type) queryParams.append('type', params.type);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());

        const response = await axios.get(
            `${API_BASE_URL}/organisation/me/opportunities?${queryParams.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to fetch opportunities');
        }

        return response.data.data;
    },

    // Get all organizations' opportunities (calls and projects)
    async getAllOpportunities(params: GetAllOpportunitiesParams = {}): Promise<OpportunityResponse> {
        const queryParams = new URLSearchParams();

        if (params.type) queryParams.append('type', params.type);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
        if (params.budgetMin) queryParams.append('budgetMin', params.budgetMin.toString());
        if (params.budgetMax) queryParams.append('budgetMax', params.budgetMax.toString());
        if (params.includeFinished !== undefined) queryParams.append('includeFinished', params.includeFinished.toString());

        // Handle array parameters
        if (params.status && params.status.length > 0) {
            params.status.forEach(s => queryParams.append('status', s));
        }
        if (params.thematicAreas && params.thematicAreas.length > 0) {
            params.thematicAreas.forEach(area => queryParams.append('thematicAreas', area));
        }
        if (params.locations && params.locations.length > 0) {
            params.locations.forEach(loc => queryParams.append('locations', loc));
        }
        if (params.organisationId) {
            queryParams.append('organisationId', params.organisationId);
        }

        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.get(
            `${API_BASE_URL}/organisation/opportunities/all?${queryParams.toString()}`,
            { headers }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to fetch all opportunities');
        }

        return response.data.data;
    },

    // Create a new call or project (placeholder for future implementation)
    async createOpportunity(_data: any): Promise<any> {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // TODO: Implement when backend endpoint is available
        throw new Error('Create opportunity not implemented yet');
    },

    // Update an existing call or project (placeholder for future implementation)
    async updateOpportunity(_id: string, _data: any): Promise<any> {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // TODO: Implement when backend endpoint is available
        throw new Error('Update opportunity not implemented yet');
    },

    // Delete a call or project (placeholder for future implementation)
    async deleteOpportunity(_id: string): Promise<any> {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // TODO: Implement when backend endpoint is available
        throw new Error('Delete opportunity not implemented yet');
    },

    // Toggle opportunity status (placeholder for future implementation)
    async toggleOpportunityStatus(_id: string, _status: 'active' | 'paused' | 'closed'): Promise<any> {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // TODO: Implement when backend endpoint is available
        throw new Error('Toggle opportunity status not implemented yet');
    },
};

export default opportunityService;
