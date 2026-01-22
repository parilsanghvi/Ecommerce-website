import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async Thunks
export const getProduct = createAsyncThunk(
    "product/getAll",
    async (
        { keyword = "", currentPage = 1, price = [0, 25000], category, ratings = 0 } = {},
        { rejectWithValue }
    ) => {
        try {
            let link = `/api/v1/products?keyword=${keyword}&page=${currentPage}`;

            if (price[0] !== 0 || price[1] !== 25000) {
                link += `&price[gte]=${price[0]}&price[lte]=${price[1]}`;
            }

            if (ratings > 0) {
                link += `&ratings[gte]=${ratings}`;
            }

            if (category) {
                link += `&category=${category}`;
            }

            const { data } = await axios.get(link);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const getAdminProduct = createAsyncThunk(
    "product/getAdminAll",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get("/api/v1/admin/products");
            return data.products;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const createProduct = createAsyncThunk(
    "product/create",
    async (productData, { rejectWithValue }) => {
        try {
            const config = {
                headers: { "Content-Type": "application/json" },
            };
            const { data } = await axios.post(
                `/api/v1/admin/product/new`,
                productData,
                config
            );
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const updateProduct = createAsyncThunk(
    "product/update",
    async ({ id, productData }, { rejectWithValue }) => {
        try {
            const config = {
                headers: { "Content-Type": "application/json" },
            };
            const { data } = await axios.put(
                `/api/v1/admin/product/${id}`,
                productData,
                config
            );
            return data.success;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const deleteProduct = createAsyncThunk(
    "product/delete",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axios.delete(`/api/v1/admin/product/${id}`);
            return data.success;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const getProductDetails = createAsyncThunk(
    "product/getDetails",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/api/v1/product/${id}`);
            return data.product;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const newReview = createAsyncThunk(
    "product/newReview",
    async (reviewData, { rejectWithValue }) => {
        try {
            const config = {
                headers: { "Content-Type": "application/json" },
            };
            const { data } = await axios.put(`/api/v1/review`, reviewData, config);
            return data.success;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const getAllReviews = createAsyncThunk(
    "product/getAllReviews",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/api/v1/reviews?id=${id}`);
            return data.reviews;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const deleteReviews = createAsyncThunk(
    "product/deleteReview",
    async ({ reviewId, productId }, { rejectWithValue }) => {
        try {
            const { data } = await axios.delete(
                `/api/v1/reviews?id=${reviewId}&productId=${productId}`
            );
            return data.success;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
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
                state.reviews = action.payload;
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
