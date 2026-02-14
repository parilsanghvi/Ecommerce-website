import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductList from '../../component/Admin/ProductList';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        product: {
            error: null, isDeleted: false,
            products: [
                { _id: 'p1', name: 'Laptop Pro', stock: 5, price: 999 },
                { _id: 'p2', name: 'Phone X', stock: 0, price: 499 },
            ],
        },
    }),
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
vi.mock('@mui/material', () => ({
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
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
                        <td>{row.id}</td>
                        <td>{row.name}</td>
                        <td>{row.stock}</td>
                        <td>{row.price}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    ),
}));

describe('ProductList', () => {
    beforeEach(() => vi.clearAllMocks());

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
});
