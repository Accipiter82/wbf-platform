import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginRequest, RegisterStep2Request, SuperAdminLoginRequest } from '../../types';
import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Async thunks
export const login = createAsyncThunk(
    'auth/login',
    async (credentials: LoginRequest, { rejectWithValue }) => {
        try {
            // Use backend authentication
            const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Login failed');
        }
    }
);

export const verifyEmail = createAsyncThunk(
    'auth/verifyEmail',
    async ({ email, code }: { email: string; code?: string }, { rejectWithValue }) => {
        try {
            const endpoint = code ? '/auth/verify/email' : '/auth/send-email-verification';
            const data = code ? { email, code } : { email };

            const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Email verification failed');
        }
    }
);

export const verifyPhone = createAsyncThunk(
    'auth/verifyPhone',
    async ({ phone, code }: { phone: string; code?: string }, { rejectWithValue }) => {
        try {
            const endpoint = code ? '/auth/verify/phone' : '/auth/send-phone-verification';
            const data = code ? { phone, code } : { phone };

            const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Phone verification failed');
        }
    }
);

export const registerStep1 = createAsyncThunk(
    'auth/registerStep1',
    async (data: { name: string; email: string; password: string; phone: string }, { rejectWithValue }) => {
        console.log('registerStep1 called with data:', { ...data, password: '***' });
        console.log('API_BASE_URL:', API_BASE_URL);

        try {
            // Transform data to match backend API expectations (name -> organisationName)
            const requestData = {
                organisationName: data.name,
                email: data.email,
                password: data.password,
                phone: data.phone,
            };
            
            // Register with backend (backend handles Firebase user creation)
            const response = await axios.post(`${API_BASE_URL}/auth/register/simple`, requestData);
            console.log('Backend response:', response.data);

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            console.error('registerStep1 error:', error);
            console.error('Error response:', error.response?.data);
            return rejectWithValue(error.response?.data?.error || 'Registration failed');
        }
    }
);

export const registerStep2 = createAsyncThunk(
    'auth/registerStep2',
    async ({ organisationId, data }: { organisationId: string; data: RegisterStep2Request }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register/step-2?organisationId=${organisationId}`, data);

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Registration failed');
        }
    }
);

export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/me`, {
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
            return rejectWithValue(error.response?.data?.error || 'Failed to get user data');
        }
    }
);

export const forgotPassword = createAsyncThunk(
    'auth/forgotPassword',
    async (email: string, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to send reset email');
        }
    }
);

export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async ({ token, password }: { token: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, { token, password });
            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to reset password');
        }
    }
);

export const superAdminLogin = createAsyncThunk(
    'auth/superAdminLogin',
    async (credentials: SuperAdminLoginRequest, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/admin/login`, credentials);

            if (response.data.success) {
                return response.data.data;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Super admin login failed');
        }
    }
);

const initialState: AuthState = {
    user: null,
    organisation: null,
    admin: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.organisation = null;
            state.admin = null;
            state.token = null;
            state.error = null;
            localStorage.removeItem('token');
        },
        clearError: (state) => {
            state.error = null;
        },
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            localStorage.setItem('token', action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.organisation = action.payload.organisation;
                state.token = action.payload.token;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Email Verification
            .addCase(verifyEmail.pending, (state) => {
                // do not set isLoading
                state.error = null;
            })
            .addCase(verifyEmail.fulfilled, (state) => {
                // do not set isLoading
                state.error = null; // Clear any previous errors
            })
            .addCase(verifyEmail.rejected, (state, action) => {
                // do not set isLoading
                state.error = action.payload as string;
            })
            // Phone Verification
            .addCase(verifyPhone.pending, (state) => {
                // do not set isLoading
                state.error = null;
            })
            .addCase(verifyPhone.fulfilled, () => {
                // do not set isLoading
            })
            .addCase(verifyPhone.rejected, (state, action) => {
                // do not set isLoading
                state.error = action.payload as string;
            })
            // Register Step 1
            .addCase(registerStep1.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerStep1.fulfilled, (state, action) => {
                state.isLoading = false;
                // Auto-login after successful registration
                if (action.payload.user && action.payload.token) {
                    state.user = action.payload.user;
                    state.organisation = action.payload.organisation;
                    state.token = action.payload.token;
                    localStorage.setItem('token', action.payload.token);
                }
            })
            .addCase(registerStep1.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Register Step 2
            .addCase(registerStep2.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerStep2.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(registerStep2.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Get Current User
            .addCase(getCurrentUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.organisation = action.payload.organisation;
            })
            .addCase(getCurrentUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                // Clear invalid token
                state.token = null;
                localStorage.removeItem('token');
            })
            // Super Admin Login
            .addCase(superAdminLogin.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(superAdminLogin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.admin = action.payload.admin;
                state.token = action.payload.token;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(superAdminLogin.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { logout, clearError, setToken } = authSlice.actions;
export default authSlice.reducer; 
