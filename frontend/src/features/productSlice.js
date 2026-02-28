import { API_BASE_URL } from "../config";
import { createSlice, createAsyncThunk, isPending, isRejected } from "@reduxjs/toolkit";
import axios from "axios";
import { createThunkHandler } from "../utils/thunkHandler";

// Async Thunks
export const getProduct = createAsyncThunk(
    "product/getAll",
    createThunkHandler(async (
        { keyword = "", currentPage = 1, price = [0, 25000], category, ratings = 0 } = {}
    ) => {
        let link = `${API_BASE_URL}/products?keyword=${keyword}&page=${currentPage}`;

        if (price[0] !== 0 || price[1] !== 25000) {
            link += `&price[gte]=${price[0]}&price[lte]=${price[1]}`;
        }

        if (ratings > 0) {
            link += `&ratings[gte]=${ratings}`;
        }

        if (category) {
            link += `&category=${category}`;
        }

        // Optimized: Filter out out-of-stock products on the server side to reduce payload and fix pagination
        link += `&stock[gt]=0`;

        const { data } = await axios.get(link);
        return data;
    })
);

export const getAdminProduct = createAsyncThunk(
    "product/getAdminAll",
    createThunkHandler(async () => {
        const { data } = await axios.get("${API_BASE_URL}/admin/products");
        return data.products;
    })
);

export const createProduct = createAsyncThunk(
    "product/create",
    createThunkHandler(async (productData) => {
        const config = {
            headers: { "Content-Type": "application/json" },
        };

        // Allow axios to handle Content-Type for FormData
        if (productData instanceof FormData) {
            delete config.headers["Content-Type"];
        }

        const { data } = await axios.post(
            `${API_BASE_URL}/admin/product/new`,
            productData,
            config
        );
        return data;
    })
);

export const updateProduct = createAsyncThunk(
    "product/update",
    createThunkHandler(async ({ id, productData }) => {
        const config = {
            headers: { "Content-Type": "application/json" },
        };
        const { data } = await axios.put(
            `${API_BASE_URL}/admin/product/${id}`,
            productData,
            config
        );
        return data.success;
    })
);

export const deleteProduct = createAsyncThunk(
    "product/delete",
    createThunkHandler(async (id) => {
        const { data } = await axios.delete(`${API_BASE_URL}/admin/product/${id}`);
        return data.success;
    })
);

export const getProductDetails = createAsyncThunk(
    "product/getDetails",
    createThunkHandler(async (id) => {
        const { data } = await axios.get(`${API_BASE_URL}/product/${id}`);
        return data.product;
    })
);

export const newReview = createAsyncThunk(
    "product/newReview",
    createThunkHandler(async (reviewData) => {
        const config = {
            headers: { "Content-Type": "application/json" },
        };
        const { data } = await axios.put(`${API_BASE_URL}/review`, reviewData, config);
        return data.success;
    })
);

export const getAllReviews = createAsyncThunk(
    "product/getAllReviews",
    createThunkHandler(async (id) => {
        const { data } = await axios.get(`${API_BASE_URL}/reviews?id=${id}`);
        return data.reviews;
    })
);

export const deleteReviews = createAsyncThunk(
    "product/deleteReview",
    createThunkHandler(async ({ reviewId, productId }) => {
        const { data } = await axios.delete(
            `${API_BASE_URL}/reviews?id=${reviewId}&productId=${productId}`
        );
        return data.success;
    })
);


const thunks = [
    getProduct,
    getAdminProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductDetails,
    newReview,
    getAllReviews,
    deleteReviews
];

// Slice
const productSlice = createSlice({
    name: "product",
    initialState: {
        products: [],
        productsCount: 0,
        resultPerPage: 0,
        filteredProductsCount: 0,
        product: {},
        loading: false,
        error: null,
        success: false,
        isDeleted: false,
        isUpdated: false,
        reviews: [],
    },
    reducers: {
        clearErrors: (state) => {
            state.error = null;
        },
        newProductReset: (state) => {
            state.success = false;
        },
        updateProductReset: (state) => {
            state.isUpdated = false;
        },
        deleteProductReset: (state) => {
            state.isDeleted = false;
        },
        newReviewReset: (state) => {
            state.success = false;
        },
        deleteReviewReset: (state) => {
            state.isDeleted = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get All Products
            .addCase(getProduct.pending, (state) => {
                state.products = [];
            })
            .addCase(getProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload.products;
                state.productsCount = action.payload.productsCount;
                state.resultPerPage = action.payload.resultPerPage;
                state.filteredProductsCount = action.payload.filteredProductsCount;
            })


            // Get Admin Products
            .addCase(getAdminProduct.pending, (state) => {
                state.products = [];
            })
            .addCase(getAdminProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })


            // Create Product

            .addCase(createProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.success = action.payload.success;
                state.product = action.payload.product;
            })


            // Update Product

            .addCase(updateProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })


            // Delete Product

            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.isDeleted = action.payload;
            })


            // Product Details
            .addCase(getProductDetails.pending, (state) => {
                state.product = {};
            })
            .addCase(getProductDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.product = action.payload;
            })


            // New Review

            .addCase(newReview.fulfilled, (state, action) => {
                state.loading = false;
                state.success = action.payload;
            })


            // Get All Reviews

            .addCase(getAllReviews.fulfilled, (state, action) => {
                state.loading = false;
                state.reviews = action.payload;
            })


            // Delete Review

            .addCase(deleteReviews.fulfilled, (state, action) => {
                state.loading = false;
                state.isDeleted = action.payload;
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

export const {
    clearErrors,
    newProductReset,
    updateProductReset,
    deleteProductReset,
    newReviewReset,
    deleteReviewReset,
} = productSlice.actions;

export default productSlice.reducer;
