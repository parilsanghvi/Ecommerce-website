import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import ProductCard from '../../component/Home/ProductCard';

// Mock MUI Rating
vi.mock('@mui/material', () => ({
    Rating: ({ value }) => <span data-testid="rating">Rating: {value}</span>,
}));

const mockProduct = {
    _id: 'prod123',
    name: 'Test Sneakers',
    price: 2999,
    images: [{ url: 'https://example.com/shoe.jpg' }],
    ratings: 4.5,
    numOfReviews: 42,
};

const renderCard = (product = mockProduct) =>
    render(
        <BrowserRouter>
            <ProductCard product={product} />
        </BrowserRouter>
    );

describe('ProductCard', () => {
    it('renders product name', () => {
        renderCard();
        expect(screen.getByText('Test Sneakers')).toBeInTheDocument();
    });

    it('renders product price with rupee symbol', () => {
        renderCard();
        expect(screen.getByText('₹2999')).toBeInTheDocument();
    });

    it('renders product image with correct alt text', () => {
        renderCard();
        const img = screen.getByAltText('Test Sneakers');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/shoe.jpg');
    });

    it('renders review count', () => {
        renderCard();
        expect(screen.getByText('(42)')).toBeInTheDocument();
    });

    it('links to the product detail page', () => {
        renderCard();
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/product/prod123');
    });
});
