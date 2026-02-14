import { describe, it, expect } from 'vitest';
import orderReducer, {
    clearErrors,
    updateOrderReset,
    deleteOrderReset,
    newOrderReset,
    createOrder,
    myOrders,
    getAllOrders,
    updateOrder,
    deleteOrder,
    getOrderDetails,
} from '../../features/orderSlice';

const initialState = {
    loading: false,
    error: null,
    order: null,
    orders: [],
    totalAmount: 0,
    totalOrders: 0,
    resultPerPage: 0,
    orderDetails: {},
    isUpdated: false,
    isDeleted: false,
    success: false,
};

describe('orderSlice', () => {
    describe('synchronous reducers', () => {
        it('clearErrors should reset error', () => {
            const state = { ...initialState, error: 'Order error' };
            expect(orderReducer(state, clearErrors()).error).toBeNull();
        });

        it('updateOrderReset should reset isUpdated', () => {
            const state = { ...initialState, isUpdated: true };
            expect(orderReducer(state, updateOrderReset()).isUpdated).toBe(false);
        });

        it('deleteOrderReset should reset isDeleted', () => {
            const state = { ...initialState, isDeleted: true };
            expect(orderReducer(state, deleteOrderReset()).isDeleted).toBe(false);
        });

        it('newOrderReset should reset success and order', () => {
            const state = { ...initialState, success: true, order: { _id: '1' } };
            const result = orderReducer(state, newOrderReset());
            expect(result.success).toBe(false);
            expect(result.order).toBeNull();
        });
    });

    describe('createOrder async thunk', () => {
        it('should set loading on pending', () => {
            const action = { type: createOrder.pending.type };
            expect(orderReducer(initialState, action).loading).toBe(true);
        });

        it('should set order and success on fulfilled', () => {
            const order = { _id: '1', totalPrice: 500 };
            const action = { type: createOrder.fulfilled.type, payload: order };
            const result = orderReducer(initialState, action);
            expect(result.order).toEqual(order);
            expect(result.success).toBe(true);
        });

        it('should set error on rejected', () => {
            const action = { type: createOrder.rejected.type, payload: 'Payment failed' };
            expect(orderReducer(initialState, action).error).toBe('Payment failed');
        });
    });

    describe('myOrders async thunk', () => {
        it('should populate orders on fulfilled', () => {
            const orders = [{ _id: '1' }, { _id: '2' }];
            const action = { type: myOrders.fulfilled.type, payload: orders };
            expect(orderReducer(initialState, action).orders).toEqual(orders);
        });
    });

    describe('getOrderDetails async thunk', () => {
        it('should set orderDetails on fulfilled', () => {
            const details = { _id: '1', orderItems: [], totalPrice: 100 };
            const action = { type: getOrderDetails.fulfilled.type, payload: details };
            expect(orderReducer(initialState, action).orderDetails).toEqual(details);
        });
    });

    describe('updateOrder async thunk', () => {
        it('should set isUpdated on fulfilled', () => {
            const action = { type: updateOrder.fulfilled.type, payload: true };
            expect(orderReducer(initialState, action).isUpdated).toBe(true);
        });
    });

    describe('deleteOrder async thunk', () => {
        it('should set isDeleted on fulfilled', () => {
            const action = { type: deleteOrder.fulfilled.type, payload: true };
            expect(orderReducer(initialState, action).isDeleted).toBe(true);
        });
    });
});
