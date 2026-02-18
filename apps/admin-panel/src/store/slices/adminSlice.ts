import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Organisation, ReviewRequest, Stats, OrganisationsResponse } from '../../types';
import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface AdminState {
    pendingOrganisations: Organisation[];
    allOrganisations: Organisation[];
    stats: Stats | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    } | null;
    isLoading: boolean;
    error: string | null;
}

// Async thunks
export const fetchPendingOrganisations = createAsyncThunk(
    'admin/fetchPendingOrganisations',
    async (params: { page?: number; limit?: number }, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());

            const response = await axios.get(`${API_BASE_URL}/admin/pending?${queryParams}`);

            if (response.data.success) {
                return response.data.data as OrganisationsResponse;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch pending organisations');
        }
    }
);

export const fetchAllOrganisations = createAsyncThunk(
    'admin/fetchAllOrganisations',
    async (params: { status?: string; page?: number; limit?: number }, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status', params.status);
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());

            const response = await axios.get(`${API_BASE_URL}/admin/organisations?${queryParams}`);

            if (response.data.success) {
                return response.data.data as OrganisationsResponse;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch organisations');
        }
    }
);

export const reviewOrganisation = createAsyncThunk(
    'admin/reviewOrganisation',
    async ({ id, review, token }: { id: string; review: ReviewRequest; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/admin/review/${id}`, review, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return { id, review };
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to review organisation');
        }
    }
);

export const fetchStats = createAsyncThunk(
    'admin/fetchStats',
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return response.data.data as Stats;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch stats');
        }
    }
);

const initialState: AdminState = {
    pendingOrganisations: [],
    allOrganisations: [],
    stats: null,
    pagination: null,
    isLoading: false,
    error: null,
};

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearOrganisations: (state) => {
            state.pendingOrganisations = [];
            state.allOrganisations = [];
            state.pagination = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Pending Organisations
            .addCase(fetchPendingOrganisations.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchPendingOrganisations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.pendingOrganisations = action.payload.organisations;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchPendingOrganisations.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch All Organisations
            .addCase(fetchAllOrganisations.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAllOrganisations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.allOrganisations = action.payload.organisations;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchAllOrganisations.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Review Organisation
            .addCase(reviewOrganisation.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(reviewOrganisation.fulfilled, (state, action) => {
                state.isLoading = false;
                // Remove from pending list
                state.pendingOrganisations = state.pendingOrganisations.filter(
                    org => org.id !== action.payload.id
                );
            })
            .addCase(reviewOrganisation.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch Stats
            .addCase(fetchStats.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchStats.fulfilled, (state, action) => {
                state.isLoading = false;
                state.stats = action.payload;
            })
            .addCase(fetchStats.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, clearOrganisations } = adminSlice.actions;
export default adminSlice.reducer; 