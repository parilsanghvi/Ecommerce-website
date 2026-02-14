import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Profile from '../../component/User/Profile';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));
vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));

let mockUserState = {};
vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({ user: mockUserState }),
}));

describe('Profile', () => {
    it('shows loader when loading', () => {
        mockUserState = { loading: true, isAuthenticated: true, user: {} };
        render(<Profile />);
        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('renders user profile data', () => {
        mockUserState = {
            loading: false,
            isAuthenticated: true,
            user: {
                name: 'John Doe',
                email: 'john@test.com',
                avatar: { url: 'https://example.com/avatar.jpg' },
                createdAt: '2024-01-15T00:00:00.000Z',
            },
        };
        render(<Profile />);
        expect(screen.getByText('My Profile')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@test.com')).toBeInTheDocument();
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });

    it('renders edit profile link', () => {
        mockUserState = {
            loading: false,
            isAuthenticated: true,
            user: { name: 'John', email: 'j@t.com', avatar: { url: '' }, createdAt: '2024-01-01' },
        };
        render(<Profile />);
        expect(screen.getByText('Edit Profile')).toHaveAttribute('href', '/me/update');
    });

    it('renders My Orders and Change Password links', () => {
        mockUserState = {
            loading: false,
            isAuthenticated: true,
            user: { name: 'John', email: 'j@t.com', avatar: { url: '' }, createdAt: '2024-01-01' },
        };
        render(<Profile />);
        expect(screen.getByText('My Orders')).toHaveAttribute('href', '/orders');
        expect(screen.getByText('Change Password')).toHaveAttribute('href', '/password/update');
    });

    it('navigates to login when not authenticated', () => {
        mockUserState = { loading: false, isAuthenticated: false, user: { avatar: { url: '' } } };
        render(<Profile />);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});
