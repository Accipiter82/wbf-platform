import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import organisationReducer from './slices/organisationSlice';
import adminReducer from './slices/adminSlice';
import wallReducer from './slices/wallSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        organisation: organisationReducer,
        admin: adminReducer,
        wall: wallReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt', 'payload.reviewedAt'],
                // Ignore these paths in the state
                ignoredPaths: ['auth.user', 'auth.organisation', 'organisation.organisations'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 