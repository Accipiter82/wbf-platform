import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { WallPost, CreateWallPostRequest, AddReactionRequest, AddCommentRequest, WallPostsResponse, PostReaction, PostComment } from '../../types';
import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface WallState {
    posts: WallPost[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    } | null;
    isLoading: boolean;
    isCreatingPost: boolean;
    isUploadingImage: boolean;
    isAddingReaction: boolean;
    isAddingComment: boolean;
    isDeletingPost: boolean;
    error: string | null;
}

// Async thunks
export const fetchWallPosts = createAsyncThunk(
    'wall/fetchWallPosts',
    async (params: { page?: number; limit?: number }, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());

            const response = await axios.get(`${API_BASE_URL}/wall/posts?${queryParams}`);

            if (response.data.success) {
                return response.data.data as WallPostsResponse;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch wall posts');
        }
    }
);

export const uploadWallImage = createAsyncThunk(
    'wall/uploadWallImage',
    async ({ file, token }: { file: File; token: string }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await axios.post(`${API_BASE_URL}/wall/upload-image`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                return response.data.data.url;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to upload image');
        }
    }
);

export const createWallPost = createAsyncThunk(
    'wall/createWallPost',
    async ({ data, token }: { data: CreateWallPostRequest; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/wall/posts`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return response.data.data as WallPost;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create wall post');
        }
    }
);

export const addReaction = createAsyncThunk(
    'wall/addReaction',
    async ({ data, token }: { data: AddReactionRequest; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/wall/posts/${data.postId}/reactions`, {
                type: data.type
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return {
                    postId: data.postId,
                    reaction: response.data.data as PostReaction
                };
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to add reaction');
        }
    }
);

export const removeReaction = createAsyncThunk(
    'wall/removeReaction',
    async ({ postId, token }: { postId: string; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/wall/posts/${postId}/reactions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return postId;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to remove reaction');
        }
    }
);

export const addComment = createAsyncThunk(
    'wall/addComment',
    async ({ data, token }: { data: AddCommentRequest; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/wall/posts/${data.postId}/comments`, {
                content: data.content
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return {
                    postId: data.postId,
                    comment: response.data.data as PostComment
                };
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to add comment');
        }
    }
);

export const deleteWallPost = createAsyncThunk(
    'wall/deleteWallPost',
    async ({ postId, token }: { postId: string; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/wall/posts/${postId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                return postId;
            } else {
                return rejectWithValue(response.data.error);
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to delete post');
        }
    }
);

const initialState: WallState = {
    posts: [],
    pagination: null,
    isLoading: false,
    isCreatingPost: false,
    isUploadingImage: false,
    isAddingReaction: false,
    isAddingComment: false,
    isDeletingPost: false,
    error: null,
};

const wallSlice = createSlice({
    name: 'wall',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearPosts: (state) => {
            state.posts = [];
            state.pagination = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Wall Posts
            .addCase(fetchWallPosts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchWallPosts.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload.pagination.page === 1) {
                    // Replace posts for first page
                    state.posts = action.payload.posts;
                } else {
                    // Append posts for subsequent pages
                    state.posts = [...state.posts, ...action.payload.posts];
                }
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchWallPosts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Upload Wall Image
            .addCase(uploadWallImage.pending, (state) => {
                state.isUploadingImage = true;
                state.error = null;
            })
            .addCase(uploadWallImage.fulfilled, (state) => {
                state.isUploadingImage = false;
            })
            .addCase(uploadWallImage.rejected, (state, action) => {
                state.isUploadingImage = false;
                state.error = action.payload as string;
            })
            // Create Wall Post
            .addCase(createWallPost.pending, (state) => {
                state.isCreatingPost = true;
                state.error = null;
            })
            .addCase(createWallPost.fulfilled, (state, action) => {
                state.isCreatingPost = false;
                state.posts = [action.payload, ...state.posts];
            })
            .addCase(createWallPost.rejected, (state, action) => {
                state.isCreatingPost = false;
                state.error = action.payload as string;
            })
            // Add Reaction
            .addCase(addReaction.pending, (state) => {
                state.isAddingReaction = true;
                state.error = null;
            })
            .addCase(addReaction.fulfilled, (state, action) => {
                state.isAddingReaction = false;
                const { postId, reaction } = action.payload;
                const post = state.posts.find(p => p.id === postId);
                if (post) {
                    // Remove existing reaction from this organisation if any
                    post.reactions = post.reactions.filter(r => r.organisationId !== reaction.organisationId);
                    // Add new reaction
                    post.reactions.push(reaction);
                }
            })
            .addCase(addReaction.rejected, (state, action) => {
                state.isAddingReaction = false;
                state.error = action.payload as string;
            })
            // Remove Reaction
            .addCase(removeReaction.fulfilled, (state, action) => {
                const postId = action.payload;
                const post = state.posts.find(p => p.id === postId);
                if (post) {
                    // Remove reaction from current organisation
                    const currentOrgId = state.posts[0]?.organisationId; // This should be from auth state
                    post.reactions = post.reactions.filter(r => r.organisationId !== currentOrgId);
                }
            })
            // Add Comment
            .addCase(addComment.pending, (state) => {
                state.isAddingComment = true;
                state.error = null;
            })
            .addCase(addComment.fulfilled, (state, action) => {
                state.isAddingComment = false;
                const { postId, comment } = action.payload;
                const post = state.posts.find(p => p.id === postId);
                if (post) {
                    post.comments.push(comment);
                }
            })
            .addCase(addComment.rejected, (state, action) => {
                state.isAddingComment = false;
                state.error = action.payload as string;
            })
            // Delete Post
            .addCase(deleteWallPost.pending, (state) => {
                state.isDeletingPost = true;
                state.error = null;
            })
            .addCase(deleteWallPost.fulfilled, (state, action) => {
                state.isDeletingPost = false;
                const postId = action.payload;
                state.posts = state.posts.filter(p => p.id !== postId);
            })
            .addCase(deleteWallPost.rejected, (state, action) => {
                state.isDeletingPost = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, clearPosts } = wallSlice.actions;
export default wallSlice.reducer;
