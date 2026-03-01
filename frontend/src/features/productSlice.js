import { API_BASE_URL } from "../config";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
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
    createThunkHandler(async (args) => {
        // Support both backward-compatible simple ID string and new object { id, page, limit }
        let id, page = 1, limit = 0;

        if (typeof args === 'object' && args !== null) {
            id = args.id;
            page = args.page || 1;
            limit = args.limit || 0;
        } else {
            id = args;
        }

        let link = `${API_BASE_URL}/reviews?id=${id}`;
        if (limit > 0) {
            link += `&page=${page}&limit=${limit}`;
        }

        const { data } = await axios.get(link);
        return {
            reviews: data.reviews,
            totalReviews: data.totalReviews,
            page: data.page,
            limit: data.limit,
            id // Pass id to allow reducer to handle appending correctly
        };
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
        totalReviews: 0,
        reviewsPage: 1,
        reviewsLimit: 0,
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
                state.loading = true;
                state.products = [];
            })
            .addCase(getProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload.products;
                state.productsCount = action.payload.productsCount;
                state.resultPerPage = action.payload.resultPerPage;
                state.filteredProductsCount = action.payload.filteredProductsCount;
            })
            .addCase(getProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get Admin Products
            .addCase(getAdminProduct.pending, (state) => {
                state.loading = true;
                state.products = [];
            })
            .addCase(getAdminProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(getAdminProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create Product
            .addCase(createProduct.pending, (state) => {
                state.loading = true;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.success = action.payload.success;
                state.product = action.payload.product;
            })
            .addCase(createProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Product
            .addCase(updateProduct.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.isUpdated = action.payload;
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete Product
            .addCase(deleteProduct.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.isDeleted = action.payload;
            })
            .addCase(deleteProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Product Details
            .addCase(getProductDetails.pending, (state) => {
                state.loading = true;
                state.product = {};
            })
            .addCase(getProductDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.product = action.payload;
            })
            .addCase(getProductDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // New Review
            .addCase(newReview.pending, (state) => {
                state.loading = true;
            })
            .addCase(newReview.fulfilled, (state, action) => {
                state.loading = false;
                state.success = action.payload;
            })
            .addCase(newReview.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get All Reviews
            .addCase(getAllReviews.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAllReviews.fulfilled, (state, action) => {
                state.loading = false;
                // Append reviews if it's a paginated request (page > 1) and same product
                if (action.payload.page > 1) {
                    state.reviews = [...state.reviews, ...action.payload.reviews];
                } else {
                    state.reviews = action.payload.reviews;
                }
                state.totalReviews = action.payload.totalReviews;
                state.reviewsPage = action.payload.page;
                state.reviewsLimit = action.payload.limit;
            })
            .addCase(getAllReviews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete Review
            .addCase(deleteReviews.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteReviews.fulfilled, (state, action) => {
                state.loading = false;
                state.isDeleted = action.payload;
            })
            .addCase(deleteReviews.rejected, (state, action) => {
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
