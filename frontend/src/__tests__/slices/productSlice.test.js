import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import productReducer, {
    clearErrors,
    newProductReset,
    updateProductReset,
    deleteProductReset,
    newReviewReset,
    deleteReviewReset,
    getProduct,
    getAdminProduct,
    getProductDetails,
    createProduct,
    updateProduct,
    deleteProduct,
    newReview,
    getAllReviews,
    deleteReviews,
} from '../../features/productSlice';

vi.mock('axios');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const initialState = {
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
};

describe('productSlice', () => {
    describe('synchronous reducers', () => {
        it('clearErrors should reset error to null', () => {
            const state = { ...initialState, error: 'Some error' };
            const result = productReducer(state, clearErrors());
            expect(result.error).toBeNull();
        });

        it('newProductReset should reset success', () => {
            const state = { ...initialState, success: true };
            const result = productReducer(state, newProductReset());
            expect(result.success).toBe(false);
        });

        it('updateProductReset should reset isUpdated', () => {
            const state = { ...initialState, isUpdated: true };
            const result = productReducer(state, updateProductReset());
            expect(result.isUpdated).toBe(false);
        });

        it('deleteProductReset should reset isDeleted', () => {
            const state = { ...initialState, isDeleted: true };
            const result = productReducer(state, deleteProductReset());
            expect(result.isDeleted).toBe(false);
        });

        it('newReviewReset should reset success', () => {
            const state = { ...initialState, success: true };
            const result = productReducer(state, newReviewReset());
            expect(result.success).toBe(false);
        });

        it('deleteReviewReset should reset isDeleted', () => {
            const state = { ...initialState, isDeleted: true };
            const result = productReducer(state, deleteReviewReset());
            expect(result.isDeleted).toBe(false);
        });
    });

    describe('getProduct async thunk', () => {
        it('should set loading on pending', () => {
            const action = { type: getProduct.pending.type };
            const result = productReducer(initialState, action);
            expect(result.loading).toBe(true);
        });

        it('should populate products on fulfilled', () => {
            const payload = {
                products: [{ _id: '1', name: 'Test' }],
                productsCount: 1,
                resultPerPage: 8,
                filteredProductsCount: 1,
            };
            const action = { type: getProduct.fulfilled.type, payload };
            const result = productReducer(initialState, action);
            expect(result.loading).toBe(false);
            expect(result.products).toEqual(payload.products);
            expect(result.productsCount).toBe(1);
        });

        it('should set error on rejected', () => {
            const action = { type: getProduct.rejected.type, payload: 'Failed to fetch' };
            const result = productReducer(initialState, action);
            expect(result.loading).toBe(false);
            expect(result.error).toBe('Failed to fetch');
        });
    });

    describe('getAdminProduct async thunk behavior', () => {
        let store;

        beforeEach(() => {
            store = mockStore({});
            vi.clearAllMocks();
        });

        it('dispatches pending and fulfilled actions on successful API call', async () => {
            const mockData = {
                data: {
                    products: [{ _id: '1', name: 'Admin Product 1' }, { _id: '2', name: 'Admin Product 2' }]
                }
            };

            axios.get.mockResolvedValueOnce(mockData);

            await store.dispatch(getAdminProduct());

            const actions = store.getActions();

            expect(actions[0].type).toBe(getAdminProduct.pending.type);
            expect(actions[1].type).toBe(getAdminProduct.fulfilled.type);
            expect(actions[1].payload).toEqual(mockData.data.products);
        });

        it('dispatches pending and rejected actions on failed API call', async () => {
            const mockError = new Error('Network Error');
            mockError.response = { data: { message: 'Server is down' } };

            axios.get.mockRejectedValueOnce(mockError);

            await store.dispatch(getAdminProduct());

            const actions = store.getActions();

            expect(actions[0].type).toBe(getAdminProduct.pending.type);
            expect(actions[1].type).toBe(getAdminProduct.rejected.type);
            expect(actions[1].payload).toBe('Server is down');
        });
    });

    describe('getAdminProduct async thunk reducers', () => {
        it('should set loading on pending', () => {
            const action = { type: getAdminProduct.pending.type };
            const result = productReducer(initialState, action);
            expect(result.loading).toBe(true);
        });

        it('should populate products on fulfilled', () => {
            const payload = [{ _id: '1', name: 'Admin Product' }];
            const action = { type: getAdminProduct.fulfilled.type, payload };
            const result = productReducer(initialState, action);
            expect(result.loading).toBe(false);
            expect(result.products).toEqual(payload);
        });

        it('should set error on rejected', () => {
            const action = { type: getAdminProduct.rejected.type, payload: 'Failed to fetch admin products' };
            const result = productReducer(initialState, action);
            expect(result.loading).toBe(false);
            expect(result.error).toBe('Failed to fetch admin products');
        });
    });

    describe('getProductDetails async thunk', () => {
        it('should set loading on pending', () => {
            const action = { type: getProductDetails.pending.type };
            const result = productReducer(initialState, action);
            expect(result.loading).toBe(true);
        });

        it('should set product on fulfilled', () => {
            const product = { _id: '1', name: 'Detail Product' };
            const action = { type: getProductDetails.fulfilled.type, payload: product };
            const result = productReducer(initialState, action);
            expect(result.product).toEqual(product);
        });
    });

    describe('createProduct async thunk', () => {
        it('should set success on fulfilled', () => {
            const action = { type: createProduct.fulfilled.type, payload: { success: true, product: { _id: '1' } } };
            const result = productReducer(initialState, action);
            expect(result.success).toBe(true);
            expect(result.product).toEqual({ _id: '1' });
        });
    });

    describe('deleteProduct async thunk', () => {
        it('should set isDeleted on fulfilled', () => {
            const action = { type: deleteProduct.fulfilled.type, payload: true };
            const result = productReducer(initialState, action);
            expect(result.isDeleted).toBe(true);
        });
    });
});
