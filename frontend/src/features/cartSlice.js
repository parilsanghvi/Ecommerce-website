import { API_BASE_URL } from "../config";
import { createSlice, createAsyncThunk, isPending, isRejected } from "@reduxjs/toolkit";
import axios from "axios";

// Initial State - loaded from localStorage
const initialState = {
    cartItems: localStorage.getItem("cartItems")
        ? JSON.parse(localStorage.getItem("cartItems"))
        : [],
    shippingInfo: localStorage.getItem("shippingInfo")
        ? JSON.parse(localStorage.getItem("shippingInfo"))
        : {},
};

// ===== ASYNC THUNKS =====

// Add to Cart
export const addItemsToCart = createAsyncThunk(
    "cart/addItemsToCart",
    async ({ id, quantity }, { getState, dispatch }) => {
        const { data } = await axios.get(`${API_BASE_URL}/product/${id}`);

        const item = {
            product: data.product._id,
            name: data.product.name,
            price: data.product.price,
            image: data.product.images[0].url,
            stock: data.product.stock,
            quantity,
        };

        return item;
    }
);

// ===== SLICE =====
const cartSlice = createSlice({
    name: "cart",
    initialState: {
        cartItems: localStorage.getItem("cartItems")
            ? JSON.parse(localStorage.getItem("cartItems"))
            : [],
        shippingInfo: localStorage.getItem("shippingInfo")
            ? JSON.parse(localStorage.getItem("shippingInfo"))
            : {},
        loading: false,
        error: null,
        success: false,
    },
    reducers: {
        removeItemsFromCart: (state, action) => {
            state.cartItems = state.cartItems.filter(
                (i) => i.product !== action.payload
            );
            localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
        },
        saveShippingInfo: (state, action) => {
            state.shippingInfo = action.payload;
            localStorage.setItem("shippingInfo", JSON.stringify(action.payload));
        },
        clearCartErrors: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addItemsToCart.pending, (state) => {
                state.success = false;
            })
            .addCase(addItemsToCart.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const item = action.payload;
                const itemIndex = state.cartItems.findIndex(
                    (i) => i.product === item.product
                );

                if (itemIndex >= 0) {
                    state.cartItems[itemIndex] = item;
                } else {
                    state.cartItems.push(item);
                }
                localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
            })


            // Matchers for common loading and error states
            .addMatcher(isPending(addItemsToCart), (state) => {
                state.loading = true;
            })
            .addMatcher(isRejected(addItemsToCart), (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export const { removeItemsFromCart, saveShippingInfo, clearCartErrors } = cartSlice.actions;
export default cartSlice.reducer;
