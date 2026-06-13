import { API_BASE_URL } from "../config";
import { createSlice, createAsyncThunk, isPending, isRejected, createSelector } from "@reduxjs/toolkit";
import axios from "axios";

// Helper to load and migrate array cart items to object structure
const loadCartItems = () => {
    try {
        const stored = localStorage.getItem("cartItems");
        if (!stored) return {};
        const parsed = JSON.parse(stored);

        // Migrate old array storage to new object storage
        if (Array.isArray(parsed)) {
            const migrated = parsed.reduce((acc, item) => {
                acc[item.product] = item;
                return acc;
            }, {});
            localStorage.setItem("cartItems", JSON.stringify(migrated));
            return migrated;
        }
        return parsed || {};
    } catch (e) {
        return {};
    }
};

const initialState = {
    cartItems: loadCartItems(),
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
        cartItems: loadCartItems(),
        shippingInfo: localStorage.getItem("shippingInfo")
            ? JSON.parse(localStorage.getItem("shippingInfo"))
            : {},
        loading: false,
        error: null,
        success: false,
    },
    reducers: {
        removeItemsFromCart: (state, action) => {
            // O(1) Deletion instead of O(N) filter
            delete state.cartItems[action.payload];
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

                // O(1) Insertion/Update
                state.cartItems[item.product] = item;
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

export const selectCartItemsArray = createSelector(
    (state) => state.cart.cartItems,
    (cartItems) => Object.values(cartItems)
);

export const { removeItemsFromCart, saveShippingInfo, clearCartErrors } = cartSlice.actions;
export default cartSlice.reducer;
