import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyOrders from '../../component/Order/MyOrders';

const mockDispatch = vi.fn();
const mockEnqueueSnackbar = vi.fn();

let mockOrderState = {};
let mockUserState = {};

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        order: mockOrderState,
        user: mockUserState,
    }),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('@mui/icons-material/Launch', () => ({ default: () => <span>🔗</span> }));
vi.mock('@mui/material/Typography', () => ({ default: ({ children, ...props }) => <span {...props}>{children}</span> }));
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
                        <td>{row.status}</td>
                        <td>{row.itemsQty}</td>
                        <td>{row.amount}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    ),
}));

describe('MyOrders', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows loader when loading', () => {
        mockUserState = { user: { name: 'John' } };
        mockOrderState = { loading: true, error: null, orders: [] };
        render(<MyOrders />);
        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('renders orders in data grid', () => {
        mockUserState = { user: { name: 'John' } };
        mockOrderState = {
            loading: false, error: null,
            orders: [
                { _id: 'ord1', orderStatus: 'Processing', orderItems: [{ name: 'A' }], totalPrice: 500 },
                { _id: 'ord2', orderStatus: 'Delivered', orderItems: [{ name: 'B' }, { name: 'C' }], totalPrice: 1200 },
            ],
        };
        render(<MyOrders />);
        expect(screen.getByText('ord1')).toBeInTheDocument();
        expect(screen.getByText('ord2')).toBeInTheDocument();
        expect(screen.getByText('Processing')).toBeInTheDocument();
        expect(screen.getByText('Delivered')).toBeInTheDocument();
    });

    it('renders user name in heading', () => {
        mockUserState = { user: { name: 'John' } };
        mockOrderState = { loading: false, error: null, orders: [] };
        render(<MyOrders />);
        expect(screen.getByText("John's Orders")).toBeInTheDocument();
    });

    it('dispatches myOrders on mount', () => {
        mockUserState = { user: { name: 'John' } };
        mockOrderState = { loading: false, error: null, orders: [] };
        render(<MyOrders />);
        expect(mockDispatch).toHaveBeenCalled();
    });
});
