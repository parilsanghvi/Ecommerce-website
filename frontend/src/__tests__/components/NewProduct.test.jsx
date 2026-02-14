import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewProduct from '../../component/Admin/NewProduct';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        product: { loading: false, error: null, success: false },
    }),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/Admin/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('@mui/material', () => ({
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock('@mui/icons-material/AccountTree', () => ({ default: () => <span>🌳</span> }));
vi.mock('@mui/icons-material/Description', () => ({ default: () => <span>📝</span> }));
vi.mock('@mui/icons-material/Storage', () => ({ default: () => <span>💾</span> }));
vi.mock('@mui/icons-material/Spellcheck', () => ({ default: () => <span>✓</span> }));
vi.mock('@mui/icons-material/AttachMoney', () => ({ default: () => <span>💲</span> }));

describe('NewProduct', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders Create Product heading', () => {
        render(<NewProduct />);
        expect(screen.getByText('Create Product')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
        render(<NewProduct />);
        expect(screen.getByPlaceholderText('Product Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Price')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Product Description')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Stock')).toBeInTheDocument();
        expect(screen.getByText('Choose Category')).toBeInTheDocument();
    });

    it('renders category dropdown with options', () => {
        render(<NewProduct />);
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Footwear')).toBeInTheDocument();
        expect(screen.getByText('SmartPhones')).toBeInTheDocument();
    });

    it('renders create button', () => {
        render(<NewProduct />);
        expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('renders sidebar', () => {
        render(<NewProduct />);
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('allows input changes', () => {
        render(<NewProduct />);
        fireEvent.change(screen.getByPlaceholderText('Product Name'), { target: { value: 'Test Product' } });
        expect(screen.getByPlaceholderText('Product Name')).toHaveValue('Test Product');
    });

    it('dispatches createProduct on form submit', () => {
        render(<NewProduct />);
        fireEvent.change(screen.getByPlaceholderText('Product Name'), { target: { value: 'New Item' } });
        fireEvent.change(screen.getByPlaceholderText('Price'), { target: { value: '100' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Create' }));
        expect(mockDispatch).toHaveBeenCalled();
    });
});
