import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UpdateProduct from '../../component/Admin/UpdateProduct';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

const productData = {
    _id: 'prod1', name: 'Test Widget', price: 999, description: 'A widget',
    category: 'Laptop', stock: 5,
    images: [{ url: 'https://example.com/img.jpg' }],
};

const stableState = {
    product: {
        loading: false, error: null, isUpdated: false, updateError: null,
        product: productData,
    },
};

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector(stableState),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'prod1' }),
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('../../component/Admin/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('@mui/material', () => ({
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock('@mui/icons-material/AccountTree', () => ({ default: () => <span>🌳</span> }));
vi.mock('@mui/icons-material/Description', () => ({ default: () => <span>📝</span> }));
vi.mock('@mui/icons-material/Storage', () => ({ default: () => <span>💾</span> }));
vi.mock('@mui/icons-material/Spellcheck', () => ({ default: () => <span>✓</span> }));
vi.mock('@mui/icons-material/AttachMoney', () => ({ default: () => <span>💲</span> }));

describe('UpdateProduct (Admin)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders Update Product heading', () => {
        render(<UpdateProduct />);
        expect(screen.getByText('Update Product')).toBeInTheDocument();
    });

    it('pre-fills product data', () => {
        render(<UpdateProduct />);
        expect(screen.getByPlaceholderText('Product Name')).toHaveValue('Test Widget');
        expect(screen.getByPlaceholderText('Price')).toHaveValue(999);
    });

    it('renders category dropdown with options', () => {
        render(<UpdateProduct />);
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Footwear')).toBeInTheDocument();
    });

    it('renders sidebar', () => {
        render(<UpdateProduct />);
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders update button', () => {
        render(<UpdateProduct />);
        expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
    });

    it('renders image previews', () => {
        render(<UpdateProduct />);
        const images = screen.getAllByAltText('Product Preview');
        expect(images.length).toBeGreaterThanOrEqual(1);
    });
});
