import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../../component/layout/Header/Header';

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        user: { isAuthenticated: false, user: null },
        cart: { cartItems: {} },
    }),
}));

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
}));

vi.mock('../../component/layout/Header/UserOptions', () => ({
    default: () => <div data-testid="user-options">UserOptions</div>,
}));

vi.mock('@mui/material', () => ({
    Box: ({ children, ...props }) => <div {...props}>{children}</div>,
    Container: ({ children }) => <div>{children}</div>,
    IconButton: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>,
    Drawer: ({ children, open }) => open ? <div data-testid="drawer">{children}</div> : null,
    List: ({ children }) => <ul>{children}</ul>,
    ListItem: ({ children }) => <li>{children}</li>,
    ListItemButton: ({ children, ...props }) => <a {...props}>{children}</a>,
    ListItemText: ({ primary }) => <span>{primary}</span>,
    Tooltip: ({ children }) => <>{children}</>,
    Badge: ({ children }) => <>{children}</>,
}));

vi.mock('@mui/icons-material/Menu', () => ({ default: () => <span>☰</span> }));
vi.mock('@mui/icons-material/Search', () => ({ default: () => <span>🔍</span> }));
vi.mock('@mui/icons-material/ShoppingCart', () => ({ default: () => <span>🛒</span> }));
vi.mock('@mui/icons-material/Login', () => ({ default: () => <span>🔑</span> }));
vi.mock('@mui/icons-material/Brightness4', () => ({ default: () => <span>🌙</span> }));
vi.mock('@mui/icons-material/Brightness7', () => ({ default: () => <span>☀️</span> }));

describe('Header', () => {
    it('renders navigation links', () => {
        render(<Header />);
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Products')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('renders search icon', () => {
        render(<Header />);
        expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('renders cart icon', () => {
        render(<Header />);
        expect(screen.getByText('🛒')).toBeInTheDocument();
    });

    it('renders login button when not authenticated', () => {
        render(<Header />);
        expect(screen.getByLabelText('Login')).toBeInTheDocument();
    });

    it('renders theme toggle', () => {
        render(<Header />);
        // Should render either sun or moon icon
        const icons = screen.queryAllByText('🌙');
        const sunIcons = screen.queryAllByText('☀️');
        expect(icons.length + sunIcons.length).toBeGreaterThanOrEqual(1);
    });
});
