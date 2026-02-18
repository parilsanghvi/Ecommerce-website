import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Products from '../component/Product/Products';

// Mock Redux
const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
    ...vi.importActual('react-redux'),
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector({
        product: {
            loading: false,
            error: null,
            products: [],
            productsCount: 0,
            resultPerPage: 8,
            filteredProductsCount: 0
        }
    }),
}));

// Mock Notistack
vi.mock('notistack', () => ({
    useSnackbar: () => ({
        enqueueSnackbar: vi.fn()
    })
}));

// Mock Router
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ keyword: '' }),
    };
});

// Mock children components to avoid complex rendering and ensure isolation
vi.mock('../component/Home/ProductCard', () => ({
    default: () => <div>ProductCard</div>,
}));
vi.mock('../component/layout/MetaData', () => ({
    default: () => <div>MetaData</div>,
}));

describe('Products Component UX', () => {

    it('shows "Clear Filters" button when filters are active and hides it when clicked', async () => {
        render(
            <BrowserRouter>
                <Products />
            </BrowserRouter>
        );

        // Initially, "Clear Filters" should not be visible because default state matches filter reset
        const clearButtonQuery = screen.queryByRole('button', { name: /clear all filters/i });
        expect(clearButtonQuery).not.toBeInTheDocument();

        // Apply a filter (e.g., select a category)
        // Note: The category list items have role="button" so we can find them
        const categoryLink = screen.getByText('Laptop');
        fireEvent.click(categoryLink);

        // Now "Clear Filters" should be visible
        // We use findByRole to wait for the re-render if necessary
        const clearButton = await screen.findByRole('button', { name: /clear all filters/i });
        expect(clearButton).toBeInTheDocument();

        // Click "Clear Filters"
        fireEvent.click(clearButton);

        // "Clear Filters" should disappear
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument();
        });
    });
});
