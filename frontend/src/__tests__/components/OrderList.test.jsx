import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrderList from '../../component/Admin/OrderList';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        order: {
            error: null, isDeleted: false,
            orders: [
                { _id: 'o1', orderStatus: 'Processing', orderItems: [{ name: 'A' }], totalPrice: 500 },
                { _id: 'o2', orderStatus: 'Delivered', orderItems: [{ name: 'B' }, { name: 'C' }], totalPrice: 1200 },
            ],
            totalOrders: 2,
            resultPerPage: 10,
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
    Pagination: () => null,
}));
vi.mock('@mui/icons-material/Edit', () => ({ default: () => <span>✏️</span> }));
vi.mock('@mui/icons-material/Delete', () => ({ default: () => <span>🗑️</span> }));
vi.mock('@mui/x-data-grid', () => ({
    DataGrid: ({ rows, columns }) => (
        <table data-testid="data-grid">
            <thead>
                <tr>{columns.map(col => <th key={col.field}>{col.headerName}</th>)}</tr>
            </thead>
            <tbody>
                {rows.map(row => (
                    <tr key={row.id}><td>{row.id}</td><td>{row.status}</td><td>{row.amount}</td></tr>
                ))}
            </tbody>
        </table>
    ),
}));

describe('OrderList (Admin)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders ALL ORDERS heading', () => {
        render(<OrderList />);
        expect(screen.getByText('ALL ORDERS')).toBeInTheDocument();
    });

    it('renders orders in data grid', () => {
        render(<OrderList />);
        expect(screen.getByText('o1')).toBeInTheDocument();
        expect(screen.getByText('o2')).toBeInTheDocument();
        expect(screen.getByText('Processing')).toBeInTheDocument();
        expect(screen.getByText('Delivered')).toBeInTheDocument();
    });

    it('renders sidebar', () => {
        render(<OrderList />);
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('dispatches getAllOrders on mount', () => {
        render(<OrderList />);
        expect(mockDispatch).toHaveBeenCalled();
    });
});
