import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersList from '../../component/Admin/UsersList';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        user: {
            error: null, isDeleted: false, message: '',
            users: [
                { _id: 'u1', name: 'John', email: 'john@test.com', role: 'admin' },
                { _id: 'u2', name: 'Jane', email: 'jane@test.com', role: 'user' },
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
                <tr>{columns.map(col => <th key={col.field}>{col.headerName}</th>)}</tr>
            </thead>
            <tbody>
                {rows.map(row => (
                    <tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.email}</td><td>{row.role}</td></tr>
                ))}
            </tbody>
        </table>
    ),
}));

describe('UsersList (Admin)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders ALL USERS heading', () => {
        render(<UsersList />);
        expect(screen.getByText('ALL USERS')).toBeInTheDocument();
    });

    it('renders users in data grid', () => {
        render(<UsersList />);
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('Jane')).toBeInTheDocument();
        expect(screen.getByText('john@test.com')).toBeInTheDocument();
        expect(screen.getByText('jane@test.com')).toBeInTheDocument();
    });

    it('shows user roles', () => {
        render(<UsersList />);
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('user')).toBeInTheDocument();
    });

    it('renders sidebar', () => {
        render(<UsersList />);
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('dispatches getAllUsers on mount', () => {
        render(<UsersList />);
        expect(mockDispatch).toHaveBeenCalled();
    });
});
