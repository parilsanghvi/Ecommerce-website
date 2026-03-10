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
    getUserDetails
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
    totalUsers: 0,
    resultPerPage: 0,
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

    describe('getUserDetails async thunk', () => {
        let store;

        beforeEach(() => {
            store = configureStore({
                reducer: {
                    user: userReducer
                }
            });
            vi.clearAllMocks();
        });

        it('should fetch user details successfully and update state', async () => {
            const mockUser = { _id: '123', name: 'Test User', email: 'test@example.com' };
            axios.get.mockResolvedValueOnce({ data: { user: mockUser } });

            const result = await store.dispatch(getUserDetails('123'));

            expect(axios.get).toHaveBeenCalledWith('/api/v1/admin/user/123');
            expect(result.type).toBe('user/getUserDetails/fulfilled');
            expect(result.payload).toEqual(mockUser);

            const state = store.getState().user;
            expect(state.usersLoading).toBe(false);
            expect(state.userDetails).toEqual(mockUser);
            expect(state.error).toBeNull();
        });

        it('should handle API errors correctly', async () => {
            const errorMessage = 'User not found';
            axios.get.mockRejectedValueOnce({
                response: { data: { message: errorMessage } }
            });

            const result = await store.dispatch(getUserDetails('999'));

            expect(axios.get).toHaveBeenCalledWith('/api/v1/admin/user/999');
            expect(result.type).toBe('user/getUserDetails/rejected');
            expect(result.payload).toBe(errorMessage);

            const state = store.getState().user;
            expect(state.usersLoading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });

        describe('reducers', () => {
            it('should set usersLoading on pending', () => {
                const action = { type: getUserDetails.pending.type };
                const result = userReducer(initialState, action);
                expect(result.usersLoading).toBe(true);
            });

            it('should set userDetails on fulfilled', () => {
                const user = { _id: '123', name: 'Test User' };
                const action = { type: getUserDetails.fulfilled.type, payload: user };
                const result = userReducer({ ...initialState, usersLoading: true }, action);
                expect(result.usersLoading).toBe(false);
                expect(result.userDetails).toEqual(user);
            });

            it('should set error on rejected', () => {
                const action = { type: getUserDetails.rejected.type, payload: 'Error fetching user' };
                const result = userReducer({ ...initialState, usersLoading: true }, action);
                expect(result.usersLoading).toBe(false);
                expect(result.error).toBe('Error fetching user');
            });
        });
    });
});
