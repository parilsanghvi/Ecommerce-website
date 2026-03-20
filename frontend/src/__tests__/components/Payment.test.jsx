import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Payment from '../../component/Cart/Payment';

import axios from 'axios';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('axios');

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        cart: {
            shippingInfo: { address: '123 St', city: 'City', state: 'MH', pinCode: '400001', country: 'IN', phoneNo: '1234567890' },
            cartItems: [{ product: 'p1', name: 'Item', price: 100, quantity: 1, image: 'img.jpg' }],
        },
        user: { user: { name: 'Test', email: 'test@test.com' } },
        order: { error: null },
    }),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/Cart/CheckoutSteps', () => ({ default: () => <div>Steps</div> }));
vi.mock('@mui/material', () => ({
    Typography: ({ children, ...props }) => <span {...props}>{children}</span>,
    CircularProgress: () => <span data-testid="circular-progress">Loading...</span>,
}));
vi.mock('@mui/icons-material/CreditCard', () => ({ default: () => <span>💳</span> }));
vi.mock('@mui/icons-material/Event', () => ({ default: () => <span>📅</span> }));
vi.mock('@mui/icons-material/VpnKey', () => ({ default: () => <span>🔑</span> }));

const mockUseStripe = vi.fn(() => ({ confirmCardPayment: vi.fn() }));
const mockUseElements = vi.fn(() => ({ getElement: vi.fn() }));

vi.mock('@stripe/react-stripe-js', () => ({
    CardNumberElement: () => <div data-testid="card-number">Card Number</div>,
    CardExpiryElement: () => <div data-testid="card-expiry">Card Expiry</div>,
    CardCvcElement: () => <div data-testid="card-cvc">Card CVC</div>,
    useStripe: () => mockUseStripe(),
    useElements: () => mockUseElements(),
}));

// Mock sessionStorage
const orderInfo = { subtotal: 100, tax: 18, shippingCharges: 0, totalPrice: 118 };

describe('Payment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock sessionStorage getter correctly in jsdom
        Object.defineProperty(window, 'sessionStorage', {
            value: {
                getItem: vi.fn((key) => {
                    if (key === 'orderInfo') return JSON.stringify(orderInfo);
                    return null;
                }),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            },
            writable: true,
        });
    });

    it('renders card info heading', () => {
        render(<Payment />);
        expect(screen.getByText('Card Info')).toBeInTheDocument();
    });

    it('renders Stripe card elements', () => {
        render(<Payment />);
        expect(screen.getByTestId('card-number')).toBeInTheDocument();
        expect(screen.getByTestId('card-expiry')).toBeInTheDocument();
        expect(screen.getByTestId('card-cvc')).toBeInTheDocument();
    });

    it('renders pay button with total price', () => {
        render(<Payment />);
        expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument();
        expect(screen.getByText('Pay - ₹118')).toBeInTheDocument();
    });

    it('shows loading state on submit', async () => {
        axios.post.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ data: { client_secret: '123' } }), 100)));
        render(<Payment />);
        const button = screen.getByRole('button', { name: /pay now/i });
        fireEvent.click(button);
        
        // The button should now be disabled and show the CircularProgress.
        expect(button).toBeDisabled();
        expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
    });

    it('renders checkout steps', () => {
        render(<Payment />);
        expect(screen.getByText('Steps')).toBeInTheDocument();
    });
});
