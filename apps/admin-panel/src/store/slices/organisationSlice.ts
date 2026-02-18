import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Organisation, RegisterStep2Request, OrganisationsResponse } from '../../types';
import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface FavoriteOrganisation {
    id: string;
    name: string;
    nameLocal?: string;
    logo: string;
    country: string;
    city?: string;
    type?: string;
    missionFields?: string[];
}

interface OrganisationState {
    organisations: Organisation[];
    currentOrganisation: Organisation | null;
    favoriteOrganisations: FavoriteOrganisation[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    } | null;
    isLoading: boolean;
    isLoadingFavorites: boolean;
    error: string | null;
}

// Async thunks
export const fetchOrganisations = createAsyncThunk(
    'organisation/fetchOrganisations',
    async (params: {
        page?: number;
        limit?: number;
        city?: string;
        contractingParty?: string;
        country?: string;
        sector?: string;
        status?: string;
        type?: string;
        minYear?: number;
        maxYear?: number;
        minStaff?: number;
        maxStaff?: number;
        minVolunteers?: number;
        maxVolunteers?: number;
        thematicArea?: string;
        expertiseOffered?: string;
        expertiseSought?: string;
        preferredRole?: string;
        geographicalCoverage?: string;
        lookingForPartnersFromCPs?: string;
        lookingForPartnersInThematicAreas?: string;
        availableResources?: string;
        projectStatus?: string;
        fundingSource?: string;
        budgetVisibility?: string;
        visibility?: string;
        search?: string;
        byCall?: string;
    }, { getState, rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();

            // Basic pagination
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());

            // Basic filters
            if (params.city) queryParams.append('city', params.city);
            if (params.contractingParty) queryParams.append('contractingParty', params.contractingParty);
            if (params.country) queryParams.append('country', params.country);
            if (params.sector) queryParams.append('sector', params.sector);
            if (params.status) queryParams.append('status', params.status);
            if (params.type) queryParams.append('type', params.type);
            if (params.search) queryParams.append('search', params.search);

            // Year filters
            if (params.minYear) queryParams.append('minYear', params.minYear.toString());
            if (params.maxYear) queryParams.append('maxYear', params.maxYear.toString());

            // Staff filters
            if (params.minStaff) queryParams.append('minStaff', params.minStaff.toString());
            if (params.maxStaff) queryParams.append('maxStaff', params.maxStaff.toString());

            // Volunteer filters
            if (params.minVolunteers) queryParams.append('minVolunteers', params.minVolunteers.toString());
            if (params.maxVolunteers) queryParams.append('maxVolunteers', params.maxVolunteers.toString());

            // Field filters
            if (params.thematicArea) queryParams.append('thematicArea', params.thematicArea);
            if (params.expertiseOffered) queryParams.append('expertiseOffered', params.expertiseOffered);
            if (params.expertiseSought) queryParams.append('expertiseSought', params.expertiseSought);
            if (params.preferredRole) queryParams.append('preferredRole', params.preferredRole);
            if (params.geographicalCoverage) queryParams.append('geographicalCoverage', params.geographicalCoverage);
            if (params.lookingForPartnersFromCPs) queryParams.append('lookingForPartnersFromCPs', params.lookingForPartnersFromCPs);
            if (params.lookingForPartnersInThematicAreas) queryParams.append('lookingForPartnersInThematicAreas', params.lookingForPartnersInThematicAreas);
            if (params.availableResources) queryParams.append('availableResources', params.availableResources);

            // Project filters
            if (params.projectStatus) queryParams.append('projectStatus', params.projectStatus);
            if (params.fundingSource) queryParams.append('fundingSource', params.fundingSource);
            if (params.budgetVisibility) queryParams.append('budgetVisibility', params.budgetVisibility);
            if (params.visibility) queryParams.append('visibility', params.visibility);
            
            // Call/Project filter - always send this parameter
            if (params.byCall) {
                queryParams.append('byCall', params.byCall);
            }

            // Get token from state if available
            const state = getState() as any;
            const token = state?.auth?.token;
            
            // Build headers - include Authorization if token exists
            const headers: Record<string, string> = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.get(`${API_BASE_URL}/organisation/browse?${queryParams}`, {
                headers
            });

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

export const fetchOrganisation = createAsyncThunk(
    'organisation/fetchOrganisation',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/organisation/${id}`);

            if (response.data.success) {
                return response.data.data as Organisation;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch organisation');
        }
    }
);

export const fetchMyProfile = createAsyncThunk(
    'organisation/fetchMyProfile',
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/organisation/me/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return response.data.data as Organisation;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch profile');
        }
    }
);

export const updateOrganisation = createAsyncThunk(
    'organisation/updateOrganisation',
    async ({ id, data, token }: { id: string; data: Partial<RegisterStep2Request>; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/organisation/${id}/edit`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to update organisation');
        }
    }
);

export const fetchFavorites = createAsyncThunk(
    'organisation/fetchFavorites',
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/organisation/favorites`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return response.data.data.organisations as FavoriteOrganisation[];
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch favorites');
        }
    }
);

export const addFavorite = createAsyncThunk(
    'organisation/addFavorite',
    async ({ organisationId, token }: { organisationId: string; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/organisation/favorites/${organisationId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return organisationId;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to add favorite');
        }
    }
);

export const removeFavorite = createAsyncThunk(
    'organisation/removeFavorite',
    async ({ organisationId, token }: { organisationId: string; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/organisation/favorites/${organisationId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return organisationId;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to remove favorite');
        }
    }
);

const initialState: OrganisationState = {
    organisations: [],
    currentOrganisation: null,
    favoriteOrganisations: [],
    pagination: null,
    isLoading: false,
    isLoadingFavorites: false,
    error: null,
};

const organisationSlice = createSlice({
    name: 'organisation',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentOrganisation: (state) => {
            state.currentOrganisation = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Organisations
            .addCase(fetchOrganisations.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchOrganisations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.organisations = action.payload.organisations;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchOrganisations.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch Organisation
            .addCase(fetchOrganisation.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchOrganisation.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentOrganisation = action.payload;
            })
            .addCase(fetchOrganisation.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch My Profile
            .addCase(fetchMyProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMyProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentOrganisation = action.payload;
            })
            .addCase(fetchMyProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update Organisation
            .addCase(updateOrganisation.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateOrganisation.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(updateOrganisation.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch Favorites
            .addCase(fetchFavorites.pending, (state) => {
                state.isLoadingFavorites = true;
                state.error = null;
            })
            .addCase(fetchFavorites.fulfilled, (state, action) => {
                state.isLoadingFavorites = false;
                state.favoriteOrganisations = action.payload;
            })
            .addCase(fetchFavorites.rejected, (state, action) => {
                state.isLoadingFavorites = false;
                state.error = action.payload as string;
            })
            // Add Favorite
            .addCase(addFavorite.fulfilled, (_state, _action) => {
                // Refetch favorites to get updated list
                // The component will handle refetching
            })
            .addCase(addFavorite.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            // Remove Favorite
            .addCase(removeFavorite.fulfilled, (state, action) => {
                state.favoriteOrganisations = state.favoriteOrganisations.filter(
                    org => org.id !== action.payload
                );
            })
            .addCase(removeFavorite.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { clearError, clearCurrentOrganisation } = organisationSlice.actions;
export default organisationSlice.reducer; 