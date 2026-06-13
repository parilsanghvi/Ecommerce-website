import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserOptions from '../../component/layout/Header/UserOptions';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        cart: { cartItems: { 'p1': { product: 'p1' }, 'p2': { product: 'p2' } } },
    }),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('@mui/material', () => ({
    Menu: ({ children, open }) => open ? <div data-testid="menu">{children}</div> : null,
    MenuItem: ({ children, onClick }) => <div role="menuitem" onClick={onClick}>{children}</div>,
    Tooltip: ({ children }) => <>{children}</>,
    IconButton: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>,
    Avatar: ({ alt, src }) => <img alt={alt} src={src} />,
    ListItemIcon: ({ children }) => <span>{children}</span>,
}));

vi.mock('@mui/icons-material/Dashboard', () => ({ default: () => <span>📊</span> }));
vi.mock('@mui/icons-material/Person', () => ({ default: () => <span>👤</span> }));
vi.mock('@mui/icons-material/ExitToApp', () => ({ default: () => <span>🚪</span> }));
vi.mock('@mui/icons-material/ListAlt', () => ({ default: () => <span>📋</span> }));
vi.mock('@mui/icons-material/ShoppingCart', () => ({ default: () => <span>🛒</span> }));

const regularUser = { name: 'John', avatar: { url: 'https://example.com/avatar.jpg' }, role: 'user' };
const adminUser = { name: 'Admin', avatar: { url: 'https://example.com/admin.jpg' }, role: 'admin' };

describe('UserOptions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders user avatar button', () => {
        render(<UserOptions user={regularUser} />);
        expect(screen.getByAltText('John')).toBeInTheDocument();
    });

    it('opens menu on click', () => {
        render(<UserOptions user={regularUser} />);
        fireEvent.click(screen.getByLabelText('Account settings'));
        expect(screen.getByTestId('menu')).toBeInTheDocument();
    });

    it('shows Profile, Orders, Cart, Logout for regular user', () => {
        render(<UserOptions user={regularUser} />);
        fireEvent.click(screen.getByLabelText('Account settings'));
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
        expect(screen.getByText(/Cart/)).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('shows Dashboard option for admin', () => {
        render(<UserOptions user={adminUser} />);
        fireEvent.click(screen.getByLabelText('Account settings'));
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('does not show Dashboard for regular user', () => {
        render(<UserOptions user={regularUser} />);
        fireEvent.click(screen.getByLabelText('Account settings'));
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('shows cart count in cart label', () => {
        render(<UserOptions user={regularUser} />);
        fireEvent.click(screen.getByLabelText('Account settings'));
        expect(screen.getByText('Cart(2)')).toBeInTheDocument();
    });

    it('navigates to profile on Profile click', () => {
        render(<UserOptions user={regularUser} />);
        fireEvent.click(screen.getByLabelText('Account settings'));
        fireEvent.click(screen.getByText('Profile'));
        expect(mockNavigate).toHaveBeenCalledWith('/account');
    });

    it('dispatches logout on Logout click', () => {
        render(<UserOptions user={regularUser} />);
        fireEvent.click(screen.getByLabelText('Account settings'));
        fireEvent.click(screen.getByText('Logout'));
        expect(mockDispatch).toHaveBeenCalled();
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Logged out successfully', { variant: 'success' });
    });
});
