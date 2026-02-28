import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Helper to construct URLs
const API_BASE_URL = "/api/v1";

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
        usersLoading: false, // New state for admin users fetching
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
            // Login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.isAuthenticated = false;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload;
            })

            // Register
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.isAuthenticated = false;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload;
            })

            // Load User
            .addCase(loadUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(loadUser.rejected, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                // state.error = action.payload; // Optional: suppress error on load failure
            })

            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(logout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Password
            .addCase(updatePassword.pending, (state) => {
                state.loading = true;
            })
            .addCase(updatePassword.fulfilled, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })
            .addCase(updatePassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Forgot Password
            .addCase(forgotPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(forgotPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.message = action.payload;
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Reset Password
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.success = action.payload;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // All Users (Admin)
            .addCase(getAllUsers.pending, (state) => {
                state.usersLoading = true;
            })
            .addCase(getAllUsers.fulfilled, (state, action) => {
                state.usersLoading = false;
                state.users = action.payload.users;
                state.totalUsers = action.payload.totalUsers;
                state.resultPerPage = action.payload.resultPerPage;
            })
            .addCase(getAllUsers.rejected, (state, action) => {
                state.usersLoading = false;
                state.error = action.payload;
            })

            // User Details (Admin)
            .addCase(getUserDetails.pending, (state) => {
                state.usersLoading = true;
            })
            .addCase(getUserDetails.fulfilled, (state, action) => {
                state.usersLoading = false;
                state.userDetails = action.payload;
            })
            .addCase(getUserDetails.rejected, (state, action) => {
                state.usersLoading = false;
                state.error = action.payload;
            })

            // Update User (Admin)
            .addCase(updateUser.pending, (state) => {
                state.usersLoading = true;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.usersLoading = false;
                state.isUpdated = action.payload;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.usersLoading = false;
                state.error = action.payload;
            })

            // Delete User (Admin)
            .addCase(deleteUser.pending, (state) => {
                state.usersLoading = true;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.usersLoading = false;
                state.isDeleted = action.payload.success;
                state.message = action.payload.message;
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.usersLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearErrors,
    updateProfileReset,
    updatePasswordReset,
    updateUserReset,
    deleteUserReset,
} = userSlice.actions;

export default userSlice.reducer;
