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
            products: [], // Empty products
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

// Mock children
vi.mock('../component/Home/ProductCard', () => ({
    default: (props) => <div>{props.product.name}</div>,
}));
vi.mock('../component/layout/MetaData', () => ({
    default: () => <div>MetaData</div>,
}));

describe('Products Component - Empty State', () => {

    it('renders "No Products Found" and "Reset Filters" button when product list is empty', async () => {
        render(
            <BrowserRouter>
                <Products />
            </BrowserRouter>
        );

        expect(screen.getByText('No Products Found')).toBeInTheDocument();
        const resetButton = screen.getByRole('button', { name: /Reset Filters/i });
        expect(resetButton).toBeInTheDocument();

        // Click the button
        fireEvent.click(resetButton);

        // Since resetFilters updates state, it triggers useEffect which dispatches getProduct
        // The getProduct action is dispatched with default values.
        // We can check if dispatch was called.
        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalled();
        }, { timeout: 1000 });
    });
});
