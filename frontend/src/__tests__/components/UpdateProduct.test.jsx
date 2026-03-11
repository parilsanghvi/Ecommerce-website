import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

import { useSelector } from 'react-redux';

vi.mock('react-redux', () => ({
    useSelector: vi.fn((selector) => selector(stableState)),
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
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default mock state for useSelector
        useSelector.mockImplementation((selector) => selector(stableState));
    });

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

    it('submits form with updated data', () => {
        render(<UpdateProduct />);
        fireEvent.change(screen.getByPlaceholderText('Product Name'), { target: { value: 'New Product' } });
        fireEvent.change(screen.getByPlaceholderText('Price'), { target: { value: 1500 } });
        fireEvent.change(screen.getByPlaceholderText('Product Description'), { target: { value: 'New desc' } });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Camera' } });
        fireEvent.change(screen.getByPlaceholderText('Stock'), { target: { value: 10 } });
        
        fireEvent.submit(screen.getByRole('button', { name: /Update/i }));
        
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('handles image uploads and removals', () => {
        // Need to pass initial image data so we have something to remove
        const productWithMultiImages = { ...productData, images: [{ url: 'img1.png' }, { url: 'img2.png' }] };
        useSelector.mockImplementation((selector) => selector({
            product: { loading: false, product: productWithMultiImages },
        }));

        render(<UpdateProduct />);
        
        const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
        
        // Mock FileReader robustly and clean it up
        const originalFileReader = window.FileReader;
        let mockOnload = null;
        
        window.FileReader = vi.fn().mockImplementation(() => ({
            readAsDataURL: vi.fn(),
            result: 'data:image/png;base64,dummy',
            get onload() { return mockOnload; },
            set onload(val) { mockOnload = val; },
            readyState: 2
        }));
        
        const fileInput = document.querySelector('input[type="file"]');
        
        act(() => {
            if (fileInput) {
                fireEvent.change(fileInput, { target: { files: [file] } });
            }
            
            // Trigger onload manually inside act
            if (mockOnload) mockOnload({ target: { result: 'data:image/png;base64,dummy' } });
        });
        
        // Remove the existing image preview
        const removeButtons = screen.getAllByRole('button', { name: /Remove image/i });
        if(removeButtons.length > 0) {
            act(() => {
                fireEvent.click(removeButtons[0]);
            });
        }
        
        window.FileReader = originalFileReader; // Cleanup
    });

    it('redirects and shows snackbar on successful update', () => {
        useSelector.mockImplementation((selector) => selector({
            product: { loading: false, isUpdated: true, product: productData },
        }));
        
        render(<UpdateProduct />);
        
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith("Product Updated Successfully", { variant: "success" });
        expect(mockNavigate).toHaveBeenCalledWith("/admin/products");
        expect(mockDispatch).toHaveBeenCalled(); // Should dispatch updateProductReset
    });

    it('fetches product details if ID mismatch or missing', () => {
        useSelector.mockImplementation((selector) => selector({
            product: { loading: false, product: { _id: 'different' } },
        }));
        
        render(<UpdateProduct />);
        
        expect(mockDispatch).toHaveBeenCalled(); // getProductDetails
    });
});
