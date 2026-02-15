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

// Mock the productSlice action
vi.mock('../features/productSlice', async () => {
  const actual = await vi.importActual('../features/productSlice');
  return {
    ...actual,
    getProduct: vi.fn((args) => ({ type: 'product/getAll', payload: args })),
  };
});
import { getProduct } from '../features/productSlice';


describe('Products Component Empty State', () => {

    it('renders no products found and reset button', () => {
        render(
            <BrowserRouter>
                <Products />
            </BrowserRouter>
        );

        expect(screen.getByText('No Products Found')).toBeInTheDocument();
        // This assertion is expected to fail initially until the feature is implemented
        expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });

    it('resets filters when button is clicked', async () => {
        render(
            <BrowserRouter>
                <Products />
            </BrowserRouter>
        );

        // Click a category to change filter
        const categoryLink = screen.getByText('Laptop');
        fireEvent.click(categoryLink);

        // Verify getProduct was called with the category
        await waitFor(() => {
             expect(getProduct).toHaveBeenCalledWith(expect.objectContaining({ category: 'Laptop' }));
        });

        // Click Reset Filters
        const resetButton = screen.getByText('Reset Filters');
        fireEvent.click(resetButton);

        // Verify getProduct was called with cleared category (undefined or empty string)
        await waitFor(() => {
             expect(getProduct).toHaveBeenCalledWith(expect.objectContaining({ category: '' }));
        });
    });
});
