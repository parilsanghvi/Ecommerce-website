import { API_BASE_URL } from "../config";
import { createSlice, createAsyncThunk, isPending, isRejected } from "@reduxjs/toolkit";
import axios from "axios";
import { createThunkHandler } from "../utils/thunkHandler";

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
    createThunkHandler(async (orderData) => {
        const config = { headers: { "Content-Type": "application/json" } };
        const { data } = await axios.post("${API_BASE_URL}/order/new", orderData, config);
        return data;
    })
);

// My Orders
export const myOrders = createAsyncThunk(
    "order/myOrders",
    createThunkHandler(async () => {
        const { data } = await axios.get("${API_BASE_URL}/orders/me");
        return data.orders;
    })
);

// Get All Orders (Admin)
export const getAllOrders = createAsyncThunk(
    "order/getAllOrders",
    createThunkHandler(async (arg = 1) => {
        let page = 1;
        let calculateTotal = false;

        if (typeof arg === 'number') {
            page = arg;
        } else if (typeof arg === 'object') {
            page = arg.page || 1;
            calculateTotal = arg.calculateTotal || false;
        }

        const { data } = await axios.get(`${API_BASE_URL}/admin/orders?page=${page}&calculateTotal=${calculateTotal}`);
        return data;
    })
);

// Update Order (Admin)
export const updateOrder = createAsyncThunk(
    "order/updateOrder",
    createThunkHandler(async ({ id, orderData }) => {
        const config = { headers: { "Content-Type": "application/json" } };
        const { data } = await axios.put(`${API_BASE_URL}/admin/order/${id}`, orderData, config);
        return data.success;
    })
);

// Delete Order (Admin)
export const deleteOrder = createAsyncThunk(
    "order/deleteOrder",
    createThunkHandler(async (id) => {
        const { data } = await axios.delete(`${API_BASE_URL}/admin/order/${id}`);
        return data.success;
    })
);

// Get Order Details
export const getOrderDetails = createAsyncThunk(
    "order/getOrderDetails",
    createThunkHandler(async (id) => {
        const { data } = await axios.get(`${API_BASE_URL}/order/${id}`);
        return data.order;
    })
);


const thunks = [
    createOrder,
    myOrders,
    getAllOrders,
    updateOrder,
    deleteOrder,
    getOrderDetails
];

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

            .addCase(createOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.order = action.payload;
                state.success = true;
            })

            // My Orders

            .addCase(myOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload;
            })

            // All Orders (Admin)

            .addCase(getAllOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload.orders;
                // Only update totalAmount if it's returned by the backend
                if (action.payload.totalAmount !== undefined) {
                    state.totalAmount = action.payload.totalAmount;
                }
                state.totalOrders = action.payload.totalOrders;
                state.resultPerPage = action.payload.resultPerPage;
            })

            // Update Order

            .addCase(updateOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })

            // Delete Order

            .addCase(deleteOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.isDeleted = action.payload;
            })

            // Order Details

            .addCase(getOrderDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.orderDetails = action.payload;
            })


            // Matchers for common loading and error states
            .addMatcher(isPending(...thunks), (state) => {
                state.loading = true;
            })
            .addMatcher(isRejected(...thunks), (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearErrors, updateOrderReset, deleteOrderReset, newOrderReset } = orderSlice.actions;
export default orderSlice.reducer;
