import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { configureStore } from '@reduxjs/toolkit';
import userReducer, {
    clearErrors,
    updateProfileReset,
    updatePasswordReset,
    updateUserReset,
    deleteUserReset,
    login,
    register,
    loadUser,
    logout,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
} from '../../features/userSlice';

const initialState = {
    user: {},
    loading: false,
    usersLoading: false,
    isAuthenticated: false,
    error: null,
    isUpdated: false,
    isDeleted: false,
    message: null,
    users: [],
    userDetails: {},
};

vi.mock('axios');

describe('userSlice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('synchronous reducers', () => {
        it('clearErrors should reset error', () => {
            const state = { ...initialState, error: 'Auth error' };
            expect(userReducer(state, clearErrors()).error).toBeNull();
        });

        it('updateProfileReset should reset isUpdated', () => {
            const state = { ...initialState, isUpdated: true };
            expect(userReducer(state, updateProfileReset()).isUpdated).toBe(false);
        });

        it('updatePasswordReset should reset isUpdated', () => {
            const state = { ...initialState, isUpdated: true };
            expect(userReducer(state, updatePasswordReset()).isUpdated).toBe(false);
        });

        it('updateUserReset should reset isUpdated', () => {
            const state = { ...initialState, isUpdated: true };
            expect(userReducer(state, updateUserReset()).isUpdated).toBe(false);
        });

        it('deleteUserReset should reset isDeleted', () => {
            const state = { ...initialState, isDeleted: true };
            expect(userReducer(state, deleteUserReset()).isDeleted).toBe(false);
        });
    });

    describe('login async thunk', () => {
        it('should set loading on pending', () => {
            const action = { type: login.pending.type };
            const result = userReducer(initialState, action);
            expect(result.loading).toBe(true);
        });

        it('should authenticate on fulfilled', () => {
            const user = { _id: '1', name: 'Test User', email: 'test@test.com' };
            const action = { type: login.fulfilled.type, payload: user };
            const result = userReducer(initialState, action);
            expect(result.loading).toBe(false);
            expect(result.isAuthenticated).toBe(true);
            expect(result.user).toEqual(user);
        });

        it('should set error on rejected', () => {
            const action = { type: login.rejected.type, payload: 'Invalid credentials' };
            const result = userReducer(initialState, action);
            expect(result.loading).toBe(false);
            expect(result.isAuthenticated).toBe(false);
            expect(result.error).toBe('Invalid credentials');
        });
    });

    describe('loadUser async thunk', () => {
        it('should set user and authenticate on fulfilled', () => {
            const user = { _id: '1', name: 'Loaded User' };
            const action = { type: loadUser.fulfilled.type, payload: user };
            const result = userReducer(initialState, action);
            expect(result.isAuthenticated).toBe(true);
            expect(result.user).toEqual(user);
        });

        it('should keep unauthenticated on rejected', () => {
            const action = { type: loadUser.rejected.type, payload: 'Not logged in' };
            const result = userReducer(initialState, action);
            expect(result.isAuthenticated).toBe(false);
        });
    });

    describe('logout async thunk', () => {
        it('should clear user and auth on fulfilled', () => {
            const loggedIn = { ...initialState, isAuthenticated: true, user: { name: 'A' } };
            const action = { type: logout.fulfilled.type };
            const result = userReducer(loggedIn, action);
            expect(result.isAuthenticated).toBe(false);
            expect(result.user).toBeNull();
        });
    });

    describe('updateProfile async thunk', () => {
        it('should set isUpdated on fulfilled', () => {
            const action = { type: updateProfile.fulfilled.type, payload: true };
            const result = userReducer(initialState, action);
            expect(result.isUpdated).toBe(true);
        });
    });

    describe('forgotPassword async thunk', () => {
        it('should set message on fulfilled', () => {
            const action = { type: forgotPassword.fulfilled.type, payload: 'Email sent' };
            const result = userReducer(initialState, action);
            expect(result.message).toBe('Email sent');
        });
    });

    describe('resetPassword async thunk', () => {
        it('should set loading and clear error on pending', () => {
            const action = { type: resetPassword.pending.type };
            const state = { ...initialState, error: 'some error' };
            const result = userReducer(state, action);
            expect(result.loading).toBe(true);
            expect(result.error).toBeNull();
        });

        it('should set success on fulfilled', () => {
            const action = { type: resetPassword.fulfilled.type, payload: true };
            const result = userReducer(initialState, action);
            expect(result.loading).toBe(false);
            expect(result.success).toBe(true);
        });

        it('should set error on rejected', () => {
            const action = { type: resetPassword.rejected.type, payload: 'Invalid token' };
            const result = userReducer(initialState, action);
            expect(result.loading).toBe(false);
            expect(result.error).toBe('Invalid token');
        });
    });

    describe('resetPassword async thunk logic', () => {
        it('should dispatch fulfilled when api call is successful', async () => {
            const mockData = { success: true };
            axios.put.mockResolvedValueOnce({ data: mockData });

            const store = configureStore({
                reducer: {
                    user: userReducer
                }
            });

            const result = await store.dispatch(resetPassword({ token: 'test-token', passwords: { password: 'new', confirmPassword: 'new' } }));

            expect(axios.put).toHaveBeenCalledWith(
                '/api/v1/password/reset/test-token',
                { password: 'new', confirmPassword: 'new' },
                { headers: { 'Content-Type': 'application/json' } }
            );

            expect(result.type).toBe('user/resetPassword/fulfilled');
            expect(result.payload).toBe(true);

            const state = store.getState().user;
            expect(state.loading).toBe(false);
            expect(state.success).toBe(true);
        });

        it('should dispatch rejected when api call fails', async () => {
            const errorResponse = {
                response: { data: { message: 'Invalid token' } }
            };
            axios.put.mockRejectedValueOnce(errorResponse);

            const store = configureStore({
                reducer: {
                    user: userReducer
                }
            });

            const result = await store.dispatch(resetPassword({ token: 'invalid-token', passwords: { password: 'new' } }));

            expect(result.type).toBe('user/resetPassword/rejected');
            expect(result.payload).toBe('Invalid token');

            const state = store.getState().user;
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Invalid token');
        });
    });
});
