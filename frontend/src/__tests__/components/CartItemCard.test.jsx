import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import CartItemCard from '../../component/Cart/CartItemCard';

// Mock MUI
vi.mock('@mui/icons-material/DeleteOutline', () => ({
    default: () => <span data-testid="delete-icon">X</span>,
}));
vi.mock('@mui/material', () => ({
    IconButton: ({ children, ...props }) => <button {...props}>{children}</button>,
    Typography: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

const mockItem = {
    product: 'prod123',
    name: 'Cool Gadget',
    price: 1500,
    image: 'https://example.com/gadget.jpg',
};

describe('CartItemCard', () => {
    it('renders item name as a link', () => {
        render(
            <BrowserRouter>
                <CartItemCard item={mockItem} deleteCartItems={vi.fn()} />
            </BrowserRouter>
        );
        const link = screen.getByText('Cool Gadget');
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', '/product/prod123');
    });

    it('renders item price', () => {
        render(
            <BrowserRouter>
                <CartItemCard item={mockItem} deleteCartItems={vi.fn()} />
            </BrowserRouter>
        );
        expect(screen.getByText('Price: ₹1500')).toBeInTheDocument();
    });

    it('renders item image with correct alt', () => {
        render(
            <BrowserRouter>
                <CartItemCard item={mockItem} deleteCartItems={vi.fn()} />
            </BrowserRouter>
        );
        const img = screen.getByAltText('Cool Gadget');
        expect(img).toHaveAttribute('src', 'https://example.com/gadget.jpg');
    });

    it('calls deleteCartItems with product id on remove click', () => {
        const mockDelete = vi.fn();
        render(
            <BrowserRouter>
                <CartItemCard item={mockItem} deleteCartItems={mockDelete} />
            </BrowserRouter>
        );
        fireEvent.click(screen.getByLabelText('Remove item'));
        expect(mockDelete).toHaveBeenCalledWith('prod123');
    });
});
