import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
import ProductReviews from '../../component/Admin/ProductReviews';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        product: {
            error: null, isDeleted: false, deleteError: null, loading: false,
            reviews: [],
        },
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
vi.mock('@mui/icons-material/Delete', () => ({ default: () => <span>🗑️</span> }));
vi.mock('@mui/icons-material/Star', () => ({ default: () => <span>⭐</span> }));
vi.mock('@mui/x-data-grid', () => ({

    DataGrid: ({ rows, columns }) => (
        <table data-testid="data-grid">
            <thead>
                <tr>{columns.map(col => <th key={col.field}>{col.headerName}</th>)}</tr>
            </thead>
            <tbody>
                {rows.map(row => (
                    <tr key={row.id}><td>{row.id}</td><td>{row.user}</td><td>{row.comment}</td><td>{row.rating}</td></tr>
                ))}
            </tbody>
        </table>
    ),
}));

describe('ProductReviews (Admin)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders ALL REVIEWS heading', () => {
        render(<ProductReviews />);
        expect(screen.getByText('ALL REVIEWS')).toBeInTheDocument();
    });

    it('renders product ID input', () => {
        render(<ProductReviews />);
        expect(screen.getByPlaceholderText('Product Id')).toBeInTheDocument();
    });

    it('renders search button', () => {
        render(<ProductReviews />);
        expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
    });

    it('shows No Reviews Found when empty', () => {
        render(<ProductReviews />);
        expect(screen.getByText('No Reviews Found')).toBeInTheDocument();
    });

    it('renders sidebar', () => {
        render(<ProductReviews />);
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('dispatches search on form submit', () => {
        render(<ProductReviews />);
        fireEvent.change(screen.getByPlaceholderText('Product Id'), { target: { value: '507f1f77bcf86cd799439011' } });
        fireEvent.submit(screen.getByRole('button', { name: /Search/i }));
        expect(mockDispatch).toHaveBeenCalled();
    });
});
