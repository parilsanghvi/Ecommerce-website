import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProtectedRoute from '../../component/Route/ProtectedRoute';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    Navigate: ({ to }) => <div data-testid="navigate">Redirect to {to}</div>,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

let mockUserState = {};

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({ user: mockUserState }),
}));

describe('ProtectedRoute', () => {
    it('renders null while loading', () => {
        mockUserState = { loading: true, isAuthenticated: false, user: null };
        const { container } = render(<ProtectedRoute />);
        expect(container.innerHTML).toBe('');
    });

    it('redirects to /login when not authenticated', () => {
        mockUserState = { loading: false, isAuthenticated: false, user: null };
        render(<ProtectedRoute />);
        expect(screen.getByTestId('navigate')).toHaveTextContent('Redirect to /login');
    });

    it('renders children when authenticated', () => {
        mockUserState = { loading: false, isAuthenticated: true, user: { role: 'user' } };
        render(<ProtectedRoute><div>Protected Content</div></ProtectedRoute>);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders Outlet when no children and authenticated', () => {
        mockUserState = { loading: false, isAuthenticated: true, user: { role: 'user' } };
        render(<ProtectedRoute />);
        expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('redirects non-admin to /account when isAdmin is true', () => {
        mockUserState = { loading: false, isAuthenticated: true, user: { role: 'user' } };
        render(<ProtectedRoute isAdmin={true}><div>Admin</div></ProtectedRoute>);
        expect(screen.getByTestId('navigate')).toHaveTextContent('Redirect to /account');
    });

    it('renders children for admin when isAdmin is true', () => {
        mockUserState = { loading: false, isAuthenticated: true, user: { role: 'admin' } };
        render(<ProtectedRoute isAdmin={true}><div>Admin Panel</div></ProtectedRoute>);
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });
});
