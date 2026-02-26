import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    CircularProgress: () => <div data-testid="circular-progress" />,
}));

// Mock CartItemCard
vi.mock('../../component/Cart/CartItemCard', () => ({
    default: ({ item }) => <div data-testid={`cart-item-${item.product}`}>{item.name}</div>,
}));

const mockDispatch = vi.fn();
let mockCartItems = [];

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({ cart: { cartItems: mockCartItems } }),
    useDispatch: () => mockDispatch,
}));

describe('Cart', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
        mockNavigate.mockClear();
    });

    it('shows empty cart message when no items', () => {
        mockCartItems = [];
        render(<Cart />);
        expect(screen.getByText('YOUR CART IS EMPTY')).toBeInTheDocument();
        expect(screen.getByText('GO SHOPPING')).toBeInTheDocument();
    });

    it('renders cart items when present', () => {
        mockCartItems = [
            { product: 'p1', name: 'Item 1', price: 100, quantity: 2, stock: 5, image: 'img.jpg' },
        ];
        render(<Cart />);
        expect(screen.getByTestId('cart-item-p1')).toBeInTheDocument();
    });

    it('calculates and displays gross total', () => {
        mockCartItems = [
            { product: 'p1', name: 'A', price: 100, quantity: 2, stock: 5, image: 'img.jpg' },
            { product: 'p2', name: 'B', price: 300, quantity: 1, stock: 3, image: 'img.jpg' },
        ];
        render(<Cart />);
        // 100*2 + 300*1 = 500
        expect(screen.getByText('₹500')).toBeInTheDocument();
    });

    it('navigates to login with redirect on checkout', () => {
        mockCartItems = [
            { product: 'p1', name: 'A', price: 100, quantity: 1, stock: 5, image: 'img.jpg' },
        ];
        render(<Cart />);
        fireEvent.click(screen.getByText('CHECK OUT NOW'));
        expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=/shipping');
    });

    it('dispatches addItemsToCart on quantity increase', () => {
        mockCartItems = [
            { product: 'p1', name: 'A', price: 100, quantity: 1, stock: 5, image: 'img.jpg' },
        ];
        render(<Cart />);
        fireEvent.click(screen.getByLabelText('Increase quantity'));
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('does not dispatch when decreasing at minimum quantity', () => {
        mockCartItems = [
            { product: 'p1', name: 'A', price: 100, quantity: 1, stock: 5, image: 'img.jpg' },
        ];
        render(<Cart />);
        const decreaseBtn = screen.getByLabelText('Decrease quantity');
        mockDispatch.mockClear();
        fireEvent.click(decreaseBtn);
        // Should not dispatch since quantity is already 1
        expect(mockDispatch).not.toHaveBeenCalled();
    });
});
