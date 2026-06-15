import React, { Fragment } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../component/Admin/ConfirmDeleteDialog', () => ({
            default: ({ open, onClose, onConfirm, itemName }) => open ? (
                <div data-testid="confirm-dialog">
                    <p>Are you sure you want to delete this {itemName}?</p>
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={onConfirm}>Delete</button>
                </div>
            ) : null
        }));
import { useSelector } from 'react-redux';
import ProductList from '../../component/Admin/ProductList';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

const stableState = {
    product: {
        error: null, isDeleted: false, deleteError: null,
        products: [
            { _id: 'p1', name: 'Laptop Pro', stock: 5, price: 999 },
            { _id: 'p2', name: 'Phone X', stock: 0, price: 499 },
        ],
    },
};

vi.mock('react-redux', () => ({
    useSelector: vi.fn((selector) => selector(stableState)),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => mockNavigate,
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/Admin/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('@mui/material', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        Button: ({ children, ...props }) => <button {...props}>{children}</button>,
        Dialog: ({ children, open, ...props }) => open ? <div role="dialog" {...props}>{children}</div> : null,
        DialogTitle: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
        DialogContent: ({ children, ...props }) => <div {...props}>{children}</div>,
        DialogActions: ({ children, ...props }) => <div {...props}>{children}</div>,
        Typography: ({ children, ...props }) => <p {...props}>{children}</p>,
    };
});
vi.mock('@mui/icons-material/Edit', () => ({ default: () => <span>✏️</span> }));
vi.mock('@mui/icons-material/Delete', () => ({ default: () => <span>🗑️</span> }));

vi.mock('@mui/x-data-grid', () => ({

    DataGrid: ({ rows, columns }) => (
        <table data-testid="data-grid">
            <thead>
                <tr>{columns.map((col) => <th key={col.field}>{col.headerName}</th>)}</tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.id}>
                        {columns.map((col) => {
                            if (col.renderCell) {
                                return <td key={col.field}>{col.renderCell({ row })}</td>;
                            }
                            return <td key={col.field}>{row[col.field]}</td>;
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    ),
}));

describe('ProductList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSelector.mockImplementation((selector) => selector(stableState));
    });

    it('renders ALL PRODUCTS heading', () => {
        render(<ProductList />);
        expect(screen.getByText('ALL PRODUCTS')).toBeInTheDocument();
    });

    it('renders products in data grid', () => {
        render(<ProductList />);
        expect(screen.getByText('Laptop Pro')).toBeInTheDocument();
        expect(screen.getByText('Phone X')).toBeInTheDocument();
        expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('renders sidebar', () => {
        render(<ProductList />);
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('dispatches getAdminProduct on mount', () => {
        render(<ProductList />);
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('renders data grid', () => {
        render(<ProductList />);
        expect(screen.getByTestId('data-grid')).toBeInTheDocument();
    });

    it('handles delete product click', () => {
        render(<ProductList />);
        const deleteButtons = screen.getAllByRole('button', { name: /Delete product/i });
        fireEvent.click(deleteButtons[0]);
        // Dispatches deleteProduct after confirmation
        const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(confirmDeleteButton);
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('redirects when product is deleted', () => {
        useSelector.mockImplementation((selector) => selector({
            product: { error: null, isDeleted: true, deleteError: null, products: [] },
        }));

        render(<ProductList />);
        
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith("Product Deleted Successfully", { variant: "success" });
        expect(mockDispatch).toHaveBeenCalled(); // deleteProductReset
    });
});
