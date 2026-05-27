import { describe, it, expect } from 'vitest';
import store from '../store';
import productReducer from '../features/productSlice';
import userReducer from '../features/userSlice';
import orderReducer from '../features/orderSlice';
import cartReducer from '../features/cartSlice';

describe('Redux Store Configuration', () => {
    it('should have the correct initial state based on reducers', () => {
        const state = store.getState();

        const expectedProductState = productReducer(undefined, { type: '@@INIT' });
        const expectedUserState = userReducer(undefined, { type: '@@INIT' });
        const expectedOrderState = orderReducer(undefined, { type: '@@INIT' });
        const expectedCartState = cartReducer(undefined, { type: '@@INIT' });

        expect(state.product).toEqual(expectedProductState);
        expect(state.user).toEqual(expectedUserState);
        expect(state.order).toEqual(expectedOrderState);
        expect(state.cart).toEqual(expectedCartState);
    });
});
