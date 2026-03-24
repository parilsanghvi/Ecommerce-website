import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../config";

// Custom helper to standardize thunk error handling
export const createThunkHandler = (asyncFunction) => async (arg, thunkAPI) => {
    try {
        return await asyncFunction(arg, thunkAPI);
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "An error occurred";
        return thunkAPI.rejectWithValue(errorMessage);
    }
};

// Async Thunks
export const login = createAsyncThunk(
    "user/login",
    createThunkHandler(async ({ email, password }) => {
        const config = { headers: { "Content-Type": "application/json" } };
        const { data } = await axios.post(
            `${API_BASE_URL}/login`,
            { email, password },
            config
        );
        return data.user;
    })
);

export const register = createAsyncThunk(
    "user/register",
    createThunkHandler(async (userData) => {
        const config = { headers: { "Content-Type": "multipart/form-data" } };
        const { data } = await axios.post(`${API_BASE_URL}/register`, userData, config);
        return data.user;
    })
);

export const loadUser = createAsyncThunk(
    "user/loadUser",
    createThunkHandler(async () => {
        const { data } = await axios.get(`${API_BASE_URL}/me`);
        return data.user;
    })
);

export const logout = createAsyncThunk(
    "user/logout",
    createThunkHandler(async () => {
        await axios.get(`${API_BASE_URL}/logout`);
    })
);

export const updateProfile = createAsyncThunk(
    "user/updateProfile",
    createThunkHandler(async (userData) => {
        const config = { headers: { "Content-Type": "multipart/form-data" } };
        const { data } = await axios.put(`${API_BASE_URL}/me/update`, userData, config);
        return data.success;
    })
);

export const updatePassword = createAsyncThunk(
    "user/updatePassword",
    createThunkHandler(async (passwords) => {
        const config = { headers: { "Content-Type": "application/json" } };
        const { data } = await axios.put(
            `${API_BASE_URL}/password/update`,
            passwords,
            config
        );
        return data.success;
    })
);

export const forgotPassword = createAsyncThunk(
    "user/forgotPassword",
    createThunkHandler(async (email) => {
        const config = { headers: { "Content-Type": "application/json" } };
        const { data } = await axios.post(
            `${API_BASE_URL}/password/forgot`,
            email,
            config
        );
        return data.message;
    })
);

export const resetPassword = createAsyncThunk(
    "user/resetPassword",
    createThunkHandler(async ({ token, passwords }) => {
        const config = { headers: { "Content-Type": "application/json" } };
        const { data } = await axios.put(
            `${API_BASE_URL}/password/reset/${token}`,
            passwords,
            config
        );
        return data.success;
    })
);

export const getAllUsers = createAsyncThunk(
    "user/getAllUsers",
    createThunkHandler(async (page = 1) => {
        const { data } = await axios.get(`${API_BASE_URL}/admin/users?page=${page}`);
        return data;
    })
);

export const getUserDetails = createAsyncThunk(
    "user/getUserDetails",
    createThunkHandler(async (id) => {
        const { data } = await axios.get(`${API_BASE_URL}/admin/user/${id}`);
        return data.user;
    })
);

export const updateUser = createAsyncThunk(
    "user/updateUser",
    createThunkHandler(async ({ id, userData }) => {
        const config = { headers: { "Content-Type": "application/json" } };
        const { data } = await axios.put(
            `${API_BASE_URL}/admin/user/${id}`,
            userData,
            config
        );
        return data.success;
    })
);

export const deleteUser = createAsyncThunk(
    "user/deleteUser",
    createThunkHandler(async (id) => {
        const { data } = await axios.delete(`${API_BASE_URL}/admin/user/${id}`);
        return data;
    })
);


// Slice
const userSlice = createSlice({
    name: "user",
    initialState: {
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
    },
    reducers: {
        clearErrors: (state) => {
            state.error = null;
        },
        updateProfileReset: (state) => {
            state.isUpdated = false;
        },
        updatePasswordReset: (state) => {
            state.isUpdated = false;
        },
        updateUserReset: (state) => {
            state.isUpdated = false;
        },
        deleteUserReset: (state) => {
            state.isDeleted = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login & Register
            .addCase(loadUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadUser.rejected, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            // All Users (Admin) - keep pagination logic from main
            .addCase(getAllUsers.fulfilled, (state, action) => {
                state.usersLoading = false;
                state.users = action.payload.users;
                state.totalUsers = action.payload.totalUsers;
                state.resultPerPage = action.payload.resultPerPage;
            })
            // User Details (Admin)
            .addCase(getUserDetails.fulfilled, (state, action) => {
                state.usersLoading = false;
                state.userDetails = action.payload;
            })
            // Update User (Admin)
            .addCase(updateUser.fulfilled, (state, action) => {
                state.usersLoading = false;
                state.isUpdated = action.payload;
            })
            // Delete User (Admin)
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.usersLoading = false;
                state.isDeleted = action.payload.success;
                state.message = action.payload.message;
            })
            // Forgot Password
            .addCase(forgotPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.message = action.payload;
            })
            // Reset Password
            .addCase(resetPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.success = action.payload;
            })

            // Matchers for common cases
            .addMatcher(isAnyOf(login.pending, register.pending), (state) => {
                state.loading = true;
                state.isAuthenticated = false;
            })
            .addMatcher(
                isAnyOf(login.fulfilled, register.fulfilled, loadUser.fulfilled),
                (state, action) => {
                    state.loading = false;
                    state.isAuthenticated = true;
                    state.user = action.payload;
                }
            )
            .addMatcher(isAnyOf(login.rejected, register.rejected), (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload;
            })
            .addMatcher(
                isAnyOf(
                    updateProfile.pending,
                    updatePassword.pending,
                    forgotPassword.pending,
                    resetPassword.pending
                ),
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                isAnyOf(
                    updateProfile.fulfilled,
                    updatePassword.fulfilled
                ),
                (state, action) => {
                    state.loading = false;
                    state.isUpdated = action.payload;
                }
            )
            .addMatcher(
                isAnyOf(
                    updateProfile.rejected,
                    updatePassword.rejected,
                    forgotPassword.rejected,
                    resetPassword.rejected,
                    logout.rejected
                ),
                (state, action) => {
                    state.loading = false;
                    state.error = action.payload;
                }
            )
            .addMatcher(
                isAnyOf(
                    getAllUsers.pending,
                    getUserDetails.pending,
                    updateUser.pending,
                    deleteUser.pending
                ),
                (state) => {
                    state.usersLoading = true;
                }
            )
            .addMatcher(
                isAnyOf(
                    getAllUsers.rejected,
                    getUserDetails.rejected,
                    updateUser.rejected,
                    deleteUser.rejected
                ),
                (state, action) => {
                    state.usersLoading = false;
                    state.error = action.payload;
                }
            );
    },
});

export const {
    clearErrors,
    updateProfileReset,
    updatePasswordReset,
    updateUserReset,
    deleteUserReset,
} = userSlice.actions;

export const selectUser = (state) => state.user;

export default userSlice.reducer;
