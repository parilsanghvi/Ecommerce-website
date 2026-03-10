import { createSlice, createAsyncThunk, isPending, isRejected } from "@reduxjs/toolkit";
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


const userThunks = [
    login,
    register,
    loadUser,
    logout,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword
];

const adminThunks = [
    getAllUsers,
    getUserDetails,
    updateUser,
    deleteUser
];

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
                state.isAuthenticated = false;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.isAuthenticated = false;
                state.user = null;
            })

            // Register
            .addCase(register.pending, (state) => {
                state.isAuthenticated = false;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(register.rejected, (state, action) => {
                state.isAuthenticated = false;
                state.user = null;
            })

            // Load User

            .addCase(loadUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(loadUser.rejected, (state, action) => {
                state.isAuthenticated = false;
                state.user = null;
            })

            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
            })


            // Update Profile

            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })


            // Update Password

            .addCase(updatePassword.fulfilled, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })


            // Forgot Password
            .addCase(forgotPassword.pending, (state) => {
                state.error = null;
            })
            .addCase(forgotPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.message = action.payload;
            })


            // Reset Password
            .addCase(resetPassword.pending, (state) => {
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state, action) => {
                state.loading = false;
                state.success = action.payload;
            })


            // All Users (Admin)

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


            // Matchers for common loading and error states
            .addMatcher(isPending(...userThunks), (state) => {
                state.loading = true;
            })
            .addMatcher(isRejected(...userThunks), (state, action) => {
                state.loading = false;
                // Suppress error on loadUser failure to prevent console spam
                if (action.type !== loadUser.rejected.type) {
                    state.error = action.payload;
                }
            })
            .addMatcher(isPending(...adminThunks), (state) => {
                state.usersLoading = true;
            })
            .addMatcher(isRejected(...adminThunks), (state, action) => {
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

export const selectUser = (state) => state.user;

export default userSlice.reducer;
