import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Initial State
const initialState = {
    loading: false,
    error: null,
    // New Order
    order: null,
    // My Orders
    orders: [],
    // All Orders (Admin)
    totalAmount: 0,
    totalOrders: 0,
    resultPerPage: 0,
    // Order Details
    orderDetails: {},
    // Update/Delete
    isUpdated: false,
    isDeleted: false,
    success: false,
};

// ===== ASYNC THUNKS =====

// Create Order
export const createOrder = createAsyncThunk(
    "order/createOrder",
    async (orderData, { rejectWithValue }) => {
        try {
            const config = { headers: { "Content-Type": "application/json" } };
            const { data } = await axios.post("/api/v1/order/new", orderData, config);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// My Orders
export const myOrders = createAsyncThunk(
    "order/myOrders",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get("/api/v1/orders/me");
            return data.orders;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// Get All Orders (Admin)
export const getAllOrders = createAsyncThunk(
    "order/getAllOrders",
    async (page = 1, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/api/v1/admin/orders?page=${page}`);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// Update Order (Admin)
export const updateOrder = createAsyncThunk(
    "order/updateOrder",
    async ({ id, orderData }, { rejectWithValue }) => {
        try {
            const config = { headers: { "Content-Type": "application/json" } };
            const { data } = await axios.put(`/api/v1/admin/order/${id}`, orderData, config);
            return data.success;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// Delete Order (Admin)
export const deleteOrder = createAsyncThunk(
    "order/deleteOrder",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axios.delete(`/api/v1/admin/order/${id}`);
            return data.success;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// Get Order Details
export const getOrderDetails = createAsyncThunk(
    "order/getOrderDetails",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/api/v1/order/${id}`);
            return data.order;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// ===== SLICE =====
const orderSlice = createSlice({
    name: "order",
    initialState,
    reducers: {
        clearErrors: (state) => {
            state.error = null;
        },
        updateOrderReset: (state) => {
            state.isUpdated = false;
        },
        deleteOrderReset: (state) => {
            state.isDeleted = false;
        },
        newOrderReset: (state) => {
            state.success = false;
            state.order = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create Order
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.order = action.payload;
                state.success = true;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // My Orders
            .addCase(myOrders.pending, (state) => {
                state.loading = true;
            })
            .addCase(myOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload;
            })
            .addCase(myOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // All Orders (Admin)
            .addCase(getAllOrders.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAllOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload.orders;
                state.totalAmount = action.payload.totalAmount;
                state.totalOrders = action.payload.totalOrders;
                state.resultPerPage = action.payload.resultPerPage;
            })
            .addCase(getAllOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update Order
            .addCase(updateOrder.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })
            .addCase(updateOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete Order
            .addCase(deleteOrder.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.isDeleted = action.payload;
            })
            .addCase(deleteOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Order Details
            .addCase(getOrderDetails.pending, (state) => {
                state.loading = true;
            })
            .addCase(getOrderDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.orderDetails = action.payload;
            })
            .addCase(getOrderDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearErrors, updateOrderReset, deleteOrderReset, newOrderReset } = orderSlice.actions;
export default orderSlice.reducer;
