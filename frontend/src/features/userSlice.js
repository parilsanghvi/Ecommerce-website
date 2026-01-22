import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async Thunks
export const login = createAsyncThunk(
    "user/login",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const config = { headers: { "Content-Type": "application/json" } };
            const { data } = await axios.post(
                `/api/v1/login`,
                { email, password },
                config
            );
            return data.user;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const register = createAsyncThunk(
    "user/register",
    async (userData, { rejectWithValue }) => {
        try {
            const config = { headers: { "Content-Type": "multipart/form-data" } };
            const { data } = await axios.post(`/api/v1/register`, userData, config);
            return data.user;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const loadUser = createAsyncThunk(
    "user/loadUser",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/api/v1/me`);
            return data.user;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const logout = createAsyncThunk(
    "user/logout",
    async (_, { rejectWithValue }) => {
        try {
            await axios.get(`/api/v1/logout`);
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const updateProfile = createAsyncThunk(
    "user/updateProfile",
    async (userData, { rejectWithValue }) => {
        try {
            const config = { headers: { "Content-Type": "multipart/form-data" } };
            const { data } = await axios.put(`/api/v1/me/update`, userData, config);
            return data.success;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const updatePassword = createAsyncThunk(
    "user/updatePassword",
    async (passwords, { rejectWithValue }) => {
        try {
            const config = { headers: { "Content-Type": "application/json" } };
            const { data } = await axios.put(
                `/api/v1/password/update`,
                passwords,
                config
            );
            return data.success;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const forgotPassword = createAsyncThunk(
    "user/forgotPassword",
    async (email, { rejectWithValue }) => {
        try {
            const config = { headers: { "Content-Type": "application/json" } };
            const { data } = await axios.post(
                `/api/v1/password/forgot`,
                email,
                config
            );
            return data.message;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const resetPassword = createAsyncThunk(
    "user/resetPassword",
    async ({ token, passwords }, { rejectWithValue }) => {
        try {
            const config = { headers: { "Content-Type": "application/json" } };
            const { data } = await axios.put(
                `/api/v1/password/reset/${token}`,
                passwords,
                config
            );
            return data.success;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const getAllUsers = createAsyncThunk(
    "user/getAllUsers",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/api/v1/admin/users`);
            return data.users;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const getUserDetails = createAsyncThunk(
    "user/getUserDetails",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/api/v1/admin/user/${id}`);
            return data.user;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const updateUser = createAsyncThunk(
    "user/updateUser",
    async ({ id, userData }, { rejectWithValue }) => {
        try {
            const config = { headers: { "Content-Type": "application/json" } };
            const { data } = await axios.put(
                `/api/v1/admin/user/${id}`,
                userData,
                config
            );
            return data.success;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const deleteUser = createAsyncThunk(
    "user/deleteUser",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axios.delete(`/api/v1/admin/user/${id}`);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
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
                state.users = action.payload;
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
