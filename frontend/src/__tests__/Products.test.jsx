import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
            products: [
                { _id: '1', name: 'Test Product 1', price: 100, images: [{ url: 'test' }], stock: 5, ratings: 4, numOfReviews: 10 },
                { _id: '2', name: 'Test Product 2', price: 200, images: [{ url: 'test' }], stock: 0, ratings: 3, numOfReviews: 5 }
            ],
            productsCount: 2,
            resultPerPage: 8,
            filteredProductsCount: 2
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

describe('Products Component', () => {

    it('renders product list', () => {
        render(
            <BrowserRouter>
                <Products />
            </BrowserRouter>
        );

        expect(screen.getByText('Inventory')).toBeInTheDocument();
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    it('dispatches getProduct action on mount', async () => {
        render(
            <BrowserRouter>
                <Products />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalled();
        }, { timeout: 1000 });
    });
});
