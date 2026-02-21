import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../../component/layout/Header/Header';

// Mocking dependencies
vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        user: { isAuthenticated: false, user: null },
        cart: { cartItems: [{ product: '1', quantity: 1 }, { product: '2', quantity: 2 }] }, // Mock cart with 2 items
    }),
}));

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
}));

// Mock UserOptions to avoid errors
vi.mock('../../component/layout/Header/UserOptions', () => ({
    default: () => <div data-testid="user-options">UserOptions</div>,
}));

// Mock MUI components
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
    Badge: ({ children, badgeContent }) => <div data-testid="badge" data-content={badgeContent}>{children}<span className="MuiBadge-badge">{badgeContent}</span></div>, // Mock Badge to render content
}));

// Mock Icons
vi.mock('@mui/icons-material/Menu', () => ({ default: () => <span>☰</span> }));
vi.mock('@mui/icons-material/Search', () => ({ default: () => <span>🔍</span> }));
vi.mock('@mui/icons-material/ShoppingCart', () => ({ default: () => <span>🛒</span> }));
vi.mock('@mui/icons-material/Login', () => ({ default: () => <span>🔑</span> }));
vi.mock('@mui/icons-material/Brightness4', () => ({ default: () => <span>🌙</span> }));
vi.mock('@mui/icons-material/Brightness7', () => ({ default: () => <span>☀️</span> }));

describe('Header Cart Badge', () => {
    it('renders badge with correct count on cart icon', () => {
        render(<Header />);
        // Expect to find the mocked Badge
        const badge = screen.getByTestId('badge');
        expect(badge).toBeInTheDocument();
        // Check if the content is correct (2 items in mock cart)
        expect(badge).toHaveAttribute('data-content', '2');
        // Check if the number is rendered
        expect(screen.getByText('2')).toBeInTheDocument();
    });
});
