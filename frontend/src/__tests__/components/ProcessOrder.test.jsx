import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProcessOrder from '../../component/Admin/ProcessOrder';

const mockDispatch = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        order: {
            loading: false, error: null, isUpdated: false, updateError: null,
            orderDetails: {
                _id: 'order99',
                user: { name: 'John' },
                shippingInfo: { phoneNo: '1234567890', address: '123 Street', city: 'Mumbai', state: 'MH', pinCode: '400001', country: 'IN' },
                paymentInfo: { status: 'succeeded' },
                totalPrice: 2500,
                orderStatus: 'Processing',
                orderItems: [{ product: 'p1', name: 'Widget', image: 'img.jpg', quantity: 2, price: 1250 }],
            },
        },
    }),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useParams: () => ({ id: 'order99' }),
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('../../component/Admin/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('@mui/material', () => ({
    Typography: ({ children, ...props }) => <span {...props}>{children}</span>,
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock('@mui/icons-material/AccountTree', () => ({ default: () => <span>🌳</span> }));

describe('ProcessOrder (Admin)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders shipping info heading', () => {
        render(<ProcessOrder />);
        expect(screen.getByText('SHIPPING INFO')).toBeInTheDocument();
    });

    it('renders shipping info', () => {
        render(<ProcessOrder />);
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('1234567890')).toBeInTheDocument();
    });

    it('renders PAID status', () => {
        render(<ProcessOrder />);
        expect(screen.getByText('PAID')).toBeInTheDocument();
    });

    it('renders order status', () => {
        render(<ProcessOrder />);
        expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('renders order items', () => {
        render(<ProcessOrder />);
        expect(screen.getByText('Widget')).toBeInTheDocument();
    });

    it('renders sidebar', () => {
        render(<ProcessOrder />);
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('dispatches getOrderDetails on mount', () => {
        render(<ProcessOrder />);
        expect(mockDispatch).toHaveBeenCalled();
    });
});
