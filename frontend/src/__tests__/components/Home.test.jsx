import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../../component/Home/Home';

// Mock dependencies
vi.mock('react-icons/cg', () => ({
    CgMouse: () => <span data-testid="mouse-icon" />,
}));

vi.mock('../../component/layout/MetaData', () => ({
    default: ({ title }) => <title>{title}</title>,
}));

vi.mock('../../component/layout/Loader', () => ({
    default: () => <div data-testid="loader">Loading...</div>,
}));

vi.mock('../../component/Home/ProductCard', () => ({
    default: ({ product }) => <div data-testid={`product-${product._id}`}>{product.name}</div>,
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

const mockDispatch = vi.fn();
let mockProductState = {};

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({ product: mockProductState }),
    useDispatch: () => mockDispatch,
}));

describe('Home', () => {
    it('shows loader when loading', () => {
        mockProductState = { loading: true, error: null, products: [] };
        render(<Home />);
        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('renders featured products when loaded', () => {
        mockProductState = {
            loading: false,
            error: null,
            products: [
                { _id: '1', name: 'Product A', price: 100, images: [{ url: 'img.jpg' }], ratings: 4, numOfReviews: 10 },
                { _id: '2', name: 'Product B', price: 200, images: [{ url: 'img2.jpg' }], ratings: 3, numOfReviews: 5 },
            ],
        };
        render(<Home />);
        expect(screen.getByText('Product A')).toBeInTheDocument();
        expect(screen.getByText('Product B')).toBeInTheDocument();
    });

    it('shows "No products found" when product list is empty', () => {
        mockProductState = { loading: false, error: null, products: [] };
        render(<Home />);
        expect(screen.getByText('No products found')).toBeInTheDocument();
    });

    it('renders hero section text', () => {
        mockProductState = { loading: false, error: null, products: [] };
        render(<Home />);
        expect(screen.getByText('Welcome to the Future')).toBeInTheDocument();
        expect(screen.getByText(/FIND AMAZING/)).toBeInTheDocument();
    });

    it('renders "Featured Drops" heading', () => {
        mockProductState = { loading: false, error: null, products: [] };
        render(<Home />);
        expect(screen.getByText('Featured Drops')).toBeInTheDocument();
    });

    it('dispatches getProduct on mount', () => {
        mockProductState = { loading: false, error: null, products: [] };
        render(<Home />);
        expect(mockDispatch).toHaveBeenCalled();
    });
});
