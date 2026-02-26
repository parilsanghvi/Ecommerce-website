import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Cart from '../../component/Cart/Cart';

// Mock react-router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock MUI
vi.mock('@mui/icons-material/RemoveShoppingCart', () => ({
    default: () => <span data-testid="empty-cart-icon" />,
}));
vi.mock('@mui/material', () => ({
    Typography: ({ children, ...props }) => <span {...props}>{children}</span>,
    Tooltip: ({ children }) => <>{children}</>,
    CircularProgress: (props) => <div role="progressbar" {...props} />, // Mock CircularProgress
}));

// Mock CartItemCard
vi.mock('../../component/Cart/CartItemCard', () => ({
    default: ({ item }) => <div data-testid={`cart-item-${item.product}`}>{item.name}</div>,
}));

// Mock useDispatch to control promise resolution
const mockDispatchFn = vi.fn();
let mockResolve;

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        cart: {
            cartItems: [
                { product: 'p1', name: 'Item 1', price: 100, quantity: 2, stock: 5, image: 'img.jpg' },
            ],
            shippingInfo: {}
        }
    }),
    useDispatch: () => mockDispatchFn,
}));

describe('Cart UX', () => {
    beforeEach(() => {
        mockDispatchFn.mockReset();
        mockDispatchFn.mockImplementation(() => new Promise((resolve) => {
            mockResolve = resolve;
        }));
        mockNavigate.mockClear();
    });

    it('shows loading spinner on "increase" button when clicked', async () => {
        render(<Cart />);

        const increaseBtn = screen.getByLabelText('Increase quantity');
        const decreaseBtn = screen.getByLabelText('Decrease quantity');

        // Click increase button
        fireEvent.click(increaseBtn);

        // Check if loading spinner appears inside increase button and buttons are disabled
        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
            expect(screen.getByLabelText('Increase quantity')).toBeDisabled();
            expect(screen.getByLabelText('Decrease quantity')).toBeDisabled();
        });

        // Resolve the dispatch promise
        mockResolve();

        // Wait for loading state to clear
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });

        // Buttons should be enabled again
        expect(increaseBtn).not.toBeDisabled();
        expect(decreaseBtn).not.toBeDisabled();
    });

    it('shows loading spinner on "decrease" button when clicked', async () => {
        render(<Cart />);

        const increaseBtn = screen.getByLabelText('Increase quantity');
        const decreaseBtn = screen.getByLabelText('Decrease quantity');

        // Click decrease button
        fireEvent.click(decreaseBtn);

        // Check spinner inside decrease button and buttons are disabled
        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
            expect(screen.getByLabelText('Increase quantity')).toBeDisabled();
            expect(screen.getByLabelText('Decrease quantity')).toBeDisabled();
        });

        // Resolve dispatch
        mockResolve();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
    });
});
