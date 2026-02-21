import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrderDetails from '../../component/Order/OrderDetails';

const mockDispatch = vi.fn();
const mockEnqueueSnackbar = vi.fn();

let mockOrderState = {};

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({ order: mockOrderState }),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useParams: () => ({ id: 'order123' }),
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('@mui/material', () => ({
    Typography: ({ children, ...props }) => <span {...props}>{children}</span>,
    Tooltip: ({ children, title }) => <div title={title}>{children}</div>,
    IconButton: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>,
}));

describe('OrderDetails', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows loader when loading', () => {
        mockOrderState = { loading: true, error: null, orderDetails: {} };
        render(<OrderDetails />);
        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('renders order details with shipping info', () => {
        mockOrderState = {
            loading: false, error: null,
            orderDetails: {
                _id: 'order123',
                user: { name: 'John' },
                shippingInfo: { phoneNo: '1234567890', address: '123 St', city: 'Mumbai', state: 'MH', pinCode: '400001', country: 'IN' },
                paymentInfo: { status: 'succeeded' },
                totalPrice: 1500,
                orderStatus: 'Delivered',
                orderItems: [{ product: 'p1', name: 'Item A', image: 'img.jpg', quantity: 2, price: 750 }],
            },
        };
        render(<OrderDetails />);
        expect(screen.getByText(/Order #order123/)).toBeInTheDocument();
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('1234567890')).toBeInTheDocument();
        expect(screen.getByText('PAID')).toBeInTheDocument();
        expect(screen.getByText('Delivered')).toBeInTheDocument();
        expect(screen.getByText('Item A')).toBeInTheDocument();
    });

    it('shows NOT PAID for failed payment', () => {
        mockOrderState = {
            loading: false, error: null,
            orderDetails: {
                _id: 'order2',
                user: { name: 'Jane' },
                shippingInfo: { phoneNo: '999', address: '456', city: 'Delhi', state: 'DL', pinCode: '110001', country: 'IN' },
                paymentInfo: { status: 'failed' },
                totalPrice: 200,
                orderStatus: 'Processing',
                orderItems: [],
            },
        };
        render(<OrderDetails />);
        expect(screen.getByText('NOT PAID')).toBeInTheDocument();
        expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('dispatches getOrderDetails on mount', () => {
        mockOrderState = { loading: false, error: null, orderDetails: { _id: 'x', user: { name: 'T' }, shippingInfo: {}, paymentInfo: {}, orderItems: [] } };
        render(<OrderDetails />);
        expect(mockDispatch).toHaveBeenCalled();
    });
});
