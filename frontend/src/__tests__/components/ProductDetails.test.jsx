import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductDetails from '../../component/Product/ProductDetails';

const mockDispatch = vi.fn(() => Promise.resolve({ type: 'fulfilled' }));
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        product: {
            loading: false, error: null, success: false, reviewError: null,
            product: {
                _id: 'prod1',
                name: 'Test Laptop',
                price: 49999,
                description: 'A great laptop for development.',
                ratings: 4.5,
                numOfReviews: 25,
                stock: 10,
                images: [{ url: 'https://example.com/img1.jpg' }, { url: 'https://example.com/img2.jpg' }],
                reviews: [
                    { _id: 'r1', name: 'Alice', rating: 5, comment: 'Excellent!' },
                    { _id: 'r2', name: 'Bob', rating: 4, comment: 'Good value.' },
                ],
            },
        },
    }),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    useParams: () => ({ id: 'prod1' }),
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('../../component/Product/ReviewCard', () => ({
    default: ({ review }) => <div data-testid="review-card">{review.name}: {review.comment}</div>,
}));
vi.mock('@mui/material', () => ({
    Dialog: ({ children, open }) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogTitle: ({ children }) => <div>{children}</div>,
    DialogContent: ({ children }) => <div>{children}</div>,
    DialogActions: ({ children }) => <div>{children}</div>,
    Button: ({ children, onClick, disabled }) => <button onClick={onClick} disabled={disabled}>{children}</button>,
    Rating: ({ value }) => <span data-testid="rating">Rating: {value}</span>,
    CircularProgress: () => <span>⏳</span>,
    Tooltip: ({ children }) => <>{children}</>,
}));
vi.mock('@mui/icons-material/NavigateNext', () => ({ default: (props) => <span {...props}>→</span> }));
vi.mock('@mui/icons-material/NavigateBefore', () => ({ default: (props) => <span {...props}>←</span> }));

describe('ProductDetails', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders product name', () => {
        render(<ProductDetails />);
        expect(screen.getByText('Test Laptop')).toBeInTheDocument();
    });

    it('renders product price', () => {
        render(<ProductDetails />);
        expect(screen.getByText('₹49999')).toBeInTheDocument();
    });

    it('renders product description', () => {
        render(<ProductDetails />);
        expect(screen.getByText('A great laptop for development.')).toBeInTheDocument();
    });

    it('renders product ID', () => {
        render(<ProductDetails />);
        expect(screen.getByText(/PRODUCT ID: prod1/)).toBeInTheDocument();
    });

    it('renders review count', () => {
        render(<ProductDetails />);
        expect(screen.getByText('(25 REVIEWS)')).toBeInTheDocument();
    });

    it('renders IN STOCK status', () => {
        render(<ProductDetails />);
        expect(screen.getByText('IN STOCK')).toBeInTheDocument();
    });

    it('renders Add to Cart button', () => {
        render(<ProductDetails />);
        expect(screen.getByText('ADD TO CART')).toBeInTheDocument();
    });

    it('renders quantity controls', () => {
        render(<ProductDetails />);
        expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument();
        expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument();
        expect(screen.getByLabelText('Product quantity')).toHaveValue(1);
    });

    it('increases quantity', () => {
        render(<ProductDetails />);
        fireEvent.click(screen.getByLabelText('Increase quantity'));
        expect(screen.getByLabelText('Product quantity')).toHaveValue(2);
    });

    it('renders LOG A REVIEW button', () => {
        render(<ProductDetails />);
        expect(screen.getByText('LOG A REVIEW')).toBeInTheDocument();
    });

    it('renders reviews', () => {
        render(<ProductDetails />);
        expect(screen.getByText(/Alice: Excellent!/)).toBeInTheDocument();
        expect(screen.getByText(/Bob: Good value./)).toBeInTheDocument();
    });

    it('renders REVIEWS heading', () => {
        render(<ProductDetails />);
        expect(screen.getByText('REVIEWS')).toBeInTheDocument();
    });

    it('renders product images', () => {
        render(<ProductDetails />);
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThanOrEqual(1);
    });

    it('dispatches getProductDetails on mount', () => {
        render(<ProductDetails />);
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('opens review dialog on button click', () => {
        render(<ProductDetails />);
        fireEvent.click(screen.getByText('LOG A REVIEW'));
        expect(screen.getByText('Submit Review')).toBeInTheDocument();
    });
});
