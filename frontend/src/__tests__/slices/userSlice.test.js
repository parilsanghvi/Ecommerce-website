import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { configureStore } from '@reduxjs/toolkit';
import userReducer, {
    createThunkHandler,
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
    getUserDetails,
    getAllUsers
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

vi.mock('axios');

describe('userSlice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createThunkHandler', () => {
        it('should return the result of the async function on success', async () => {
            const mockAsyncFunction = vi.fn().mockResolvedValue('success data');
            const thunkAPI = { rejectWithValue: vi.fn() };
            const arg = { id: 1 };

            const handler = createThunkHandler(mockAsyncFunction);
            const result = await handler(arg, thunkAPI);

            expect(mockAsyncFunction).toHaveBeenCalledWith(arg, thunkAPI);
            expect(result).toBe('success data');
            expect(thunkAPI.rejectWithValue).not.toHaveBeenCalled();
        });

        it('should return rejectWithValue with response.data.message on API error', async () => {
            const mockAsyncFunction = vi.fn().mockRejectedValue({
                response: { data: { message: 'API error message' } }
            });
            const thunkAPI = { rejectWithValue: vi.fn().mockImplementation(msg => `rejected: ${msg}`) };

            const handler = createThunkHandler(mockAsyncFunction);
            const result = await handler(null, thunkAPI);

            expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith('API error message');
            expect(result).toBe('rejected: API error message');
        });

        it('should return rejectWithValue with error.message on standard error', async () => {
            const mockAsyncFunction = vi.fn().mockRejectedValue(new Error('Network error'));
            const thunkAPI = { rejectWithValue: vi.fn().mockImplementation(msg => `rejected: ${msg}`) };

            const handler = createThunkHandler(mockAsyncFunction);
            const result = await handler(null, thunkAPI);

            expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith('Network error');
            expect(result).toBe('rejected: Network error');
        });

        it('should return rejectWithValue with default message when error has no standard message fields', async () => {
            const mockAsyncFunction = vi.fn().mockRejectedValue({});
            const thunkAPI = { rejectWithValue: vi.fn().mockImplementation(msg => `rejected: ${msg}`) };

            const handler = createThunkHandler(mockAsyncFunction);
            const result = await handler(null, thunkAPI);

            expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith('An error occurred');
            expect(result).toBe('rejected: An error occurred');
        });
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


    describe('getAllUsers async thunk', () => {
        let store;

        beforeEach(() => {
            store = configureStore({
                reducer: {
                    user: userReducer
                }
            });
            vi.clearAllMocks();
        });

        it('should fetch all users successfully and update state', async () => {
            const mockData = {
                users: [{ _id: '1', name: 'User 1' }, { _id: '2', name: 'User 2' }],
                totalUsers: 2,
                resultPerPage: 10
            };
            axios.get.mockResolvedValueOnce({ data: mockData });

            const result = await store.dispatch(getAllUsers(1));

            expect(axios.get).toHaveBeenCalledWith('/api/v1/admin/users?page=1');
            expect(result.type).toBe('user/getAllUsers/fulfilled');
            expect(result.payload).toEqual(mockData);

            const state = store.getState().user;
            expect(state.usersLoading).toBe(false);
            expect(state.users).toEqual(mockData.users);
            expect(state.totalUsers).toEqual(mockData.totalUsers);
            expect(state.resultPerPage).toEqual(mockData.resultPerPage);
            expect(state.error).toBeNull();
        });

        it('should handle API errors correctly', async () => {
            const errorMessage = 'Failed to fetch users';
            axios.get.mockRejectedValueOnce({
                response: { data: { message: errorMessage } }
            });

            const result = await store.dispatch(getAllUsers(1));

            expect(axios.get).toHaveBeenCalledWith('/api/v1/admin/users?page=1');
            expect(result.type).toBe('user/getAllUsers/rejected');
            expect(result.payload).toBe(errorMessage);

            const state = store.getState().user;
            expect(state.usersLoading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });

        describe('reducers', () => {
            it('should set usersLoading on pending', () => {
                const action = { type: getAllUsers.pending.type };
                const result = userReducer(initialState, action);
                expect(result.usersLoading).toBe(true);
            });

            it('should set users data on fulfilled', () => {
                const payload = {
                    users: [{ _id: '1' }],
                    totalUsers: 1,
                    resultPerPage: 10
                };
                const action = { type: getAllUsers.fulfilled.type, payload };
                const result = userReducer({ ...initialState, usersLoading: true }, action);
                expect(result.usersLoading).toBe(false);
                expect(result.users).toEqual(payload.users);
                expect(result.totalUsers).toBe(payload.totalUsers);
                expect(result.resultPerPage).toBe(payload.resultPerPage);
            });

            it('should set error on rejected', () => {
                const action = { type: getAllUsers.rejected.type, payload: 'Error fetching users' };
                const result = userReducer({ ...initialState, usersLoading: true }, action);
                expect(result.usersLoading).toBe(false);
                expect(result.error).toBe('Error fetching users');
            });
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
