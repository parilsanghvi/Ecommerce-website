import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Products from '../component/Product/Products';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock Redux
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector({
        products: {
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
jest.mock('notistack', () => ({
    useSnackbar: () => ({
        enqueueSnackbar: jest.fn()
    })
}));

// Mock Router
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ keyword: '' }),
}));

// Mock ProductCard child component to avoid deeper rendering issues
jest.mock('../component/Home/ProductCard', () => (props) => <div>{props.product.name}</div>);
jest.mock('../component/layout/MetaData', () => () => <div>MetaData</div>);

describe('Products Component', () => {

    test('renders product list', () => {
        render(
            <BrowserRouter>
                <Products />
            </BrowserRouter>
        );

        expect(screen.getByText('Inventory')).toBeInTheDocument();
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        // Since we mock ProductCard to just show name
    });

    test('dispatches getProduct action on mount', () => {
        render(
            <BrowserRouter>
                <Products />
            </BrowserRouter>
        );

        expect(mockDispatch).toHaveBeenCalled();
    });
});
