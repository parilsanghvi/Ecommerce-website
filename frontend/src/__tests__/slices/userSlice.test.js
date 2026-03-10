import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
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
    getAllUsers,
} from '../../features/userSlice';

vi.mock('axios');

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

describe('userSlice', () => {
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

    describe('getAllUsers async thunk', () => {
        let store;

        beforeEach(() => {
            store = configureStore({
                reducer: {
                    user: userReducer,
                },
                preloadedState: {
                    user: initialState
                }
            });
            vi.clearAllMocks();
        });

        it('should handle pending state', () => {
            const action = { type: getAllUsers.pending.type };
            const result = userReducer(initialState, action);
            expect(result.usersLoading).toBe(true);
        });

        it('should handle fulfilled state and fetch users successfully', async () => {
            const mockData = {
                users: [{ _id: '1', name: 'User 1' }, { _id: '2', name: 'User 2' }],
                totalUsers: 2,
                resultPerPage: 10,
            };

            axios.get.mockResolvedValueOnce({ data: mockData });

            await store.dispatch(getAllUsers(1));

            const state = store.getState().user;
            expect(state.usersLoading).toBe(false);
            expect(state.users).toEqual(mockData.users);
            expect(state.totalUsers).toBe(mockData.totalUsers);
            expect(state.resultPerPage).toBe(mockData.resultPerPage);
            expect(axios.get).toHaveBeenCalledWith('/api/v1/admin/users?page=1');
        });

        it('should handle rejected state and set error on failure', async () => {
            const errorMessage = 'Network Error';
            axios.get.mockRejectedValueOnce({
                response: { data: { message: errorMessage } }
            });

            await store.dispatch(getAllUsers(1));

            const state = store.getState().user;
            expect(state.usersLoading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });
});
