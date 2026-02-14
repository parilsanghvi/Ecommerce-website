import { describe, it, expect, beforeEach } from 'vitest';
import cartReducer, {
    removeItemsFromCart,
    saveShippingInfo,
    clearCartErrors,
    addItemsToCart,
} from '../../features/cartSlice';

describe('cartSlice', () => {
    const initialState = {
        cartItems: [],
        shippingInfo: {},
        loading: false,
        error: null,
        success: false,
    };

    beforeEach(() => {
        localStorage.clear();
    });

    describe('removeItemsFromCart', () => {
        it('should remove an item by product id', () => {
            const stateWithItems = {
                ...initialState,
                cartItems: [
                    { product: 'p1', name: 'Item 1', price: 100, quantity: 1 },
                    { product: 'p2', name: 'Item 2', price: 200, quantity: 2 },
                ],
            };
            const result = cartReducer(stateWithItems, removeItemsFromCart('p1'));
            expect(result.cartItems).toHaveLength(1);
            expect(result.cartItems[0].product).toBe('p2');
        });

        it('should sync with localStorage after removal', () => {
            const stateWithItems = {
                ...initialState,
                cartItems: [{ product: 'p1', name: 'Item 1', price: 100, quantity: 1 }],
            };
            cartReducer(stateWithItems, removeItemsFromCart('p1'));
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('saveShippingInfo', () => {
        it('should save shipping info to state', () => {
            const shipping = { address: '123 St', city: 'City', pinCode: 12345 };
            const result = cartReducer(initialState, saveShippingInfo(shipping));
            expect(result.shippingInfo).toEqual(shipping);
        });

        it('should sync shipping info to localStorage', () => {
            const shipping = { address: '123 St' };
            cartReducer(initialState, saveShippingInfo(shipping));
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'shippingInfo',
                JSON.stringify(shipping)
            );
        });
    });

    describe('clearCartErrors', () => {
        it('should clear error state', () => {
            const errorState = { ...initialState, error: 'Something went wrong' };
            const result = cartReducer(errorState, clearCartErrors());
            expect(result.error).toBeNull();
        });
    });

    describe('addItemsToCart extraReducers', () => {
        it('should set loading on pending', () => {
            const action = { type: addItemsToCart.pending.type };
            const result = cartReducer(initialState, action);
            expect(result.loading).toBe(true);
            expect(result.success).toBe(false);
        });

        it('should add new item on fulfilled', () => {
            const item = { product: 'p1', name: 'New Item', price: 100, quantity: 1 };
            const action = { type: addItemsToCart.fulfilled.type, payload: item };
            const result = cartReducer(initialState, action);
            expect(result.loading).toBe(false);
            expect(result.success).toBe(true);
            expect(result.cartItems).toHaveLength(1);
            expect(result.cartItems[0].name).toBe('New Item');
        });

        it('should update existing item on fulfilled', () => {
            const stateWithItem = {
                ...initialState,
                cartItems: [{ product: 'p1', name: 'Old', price: 100, quantity: 1 }],
            };
            const updated = { product: 'p1', name: 'Old', price: 100, quantity: 3 };
            const action = { type: addItemsToCart.fulfilled.type, payload: updated };
            const result = cartReducer(stateWithItem, action);
            expect(result.cartItems).toHaveLength(1);
            expect(result.cartItems[0].quantity).toBe(3);
        });

        it('should set error on rejected', () => {
            const action = { type: addItemsToCart.rejected.type, error: { message: 'Network error' } };
            const result = cartReducer(initialState, action);
            expect(result.loading).toBe(false);
            expect(result.error).toBe('Network error');
        });
    });
});
