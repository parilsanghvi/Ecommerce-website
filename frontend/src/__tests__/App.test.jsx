import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import store from '../store';
import { loadUser } from '../features/userSlice';
import axios from 'axios';

vi.mock('../store', () => ({
    default: {
        dispatch: vi.fn(),
        getState: vi.fn(() => ({
            user: { isAuthenticated: false, loading: false, user: null },
            cart: { cartItems: [] }
        }))
    }
}));

vi.mock('../features/userSlice', () => ({
    loadUser: vi.fn()
}));

vi.mock('axios');

// Mock Layouts
vi.mock('../component/layout/Header/Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('../component/layout/Footer/Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));
vi.mock('../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('../component/layout/Not Found/NotFound', () => ({ default: () => <div data-testid="not-found">Not Found Route</div> }));


// Mock Routes - Manually for hoisting
vi.mock('../component/Home/Home', () => ({ default: () => <div data-testid="home">Home</div> }));
vi.mock('../component/User/LoginSignup', () => ({ default: () => <div data-testid="login">Login</div> }));
vi.mock('../component/User/Profile', () => ({ default: () => <div data-testid="profile">Profile</div> }));
vi.mock('../component/Admin/Dashboard', () => ({ default: () => <div data-testid="dashboard">Dashboard</div> }));
vi.mock('../component/Admin/ProductList', () => ({ default: () => <div data-testid="product-list">ProductList</div> }));
vi.mock('../component/Admin/OrderList', () => ({ default: () => <div data-testid="order-list">OrderList</div> }));
vi.mock('../component/Product/Products', () => ({ default: () => <div data-testid="products">Products</div> }));
vi.mock('../component/Product/Search', () => ({ default: () => <div data-testid="search">Search</div> }));
vi.mock('../component/User/ForgotPassword', () => ({ default: () => <div data-testid="forgot-password">ForgotPassword</div> }));
vi.mock('../component/Cart/Cart', () => ({ default: () => <div data-testid="cart">Cart</div> }));
vi.mock('../component/layout/Contact/Contact', () => ({ default: () => <div data-testid="contact">Contact</div> }));
vi.mock('../component/layout/About/About', () => ({ default: () => <div data-testid="about">About</div> }));


import { Outlet } from 'react-router-dom';
vi.mock('../component/Route/ProtectedRoute', () => ({
    default: ({ children }) => <div data-testid="protected">{children || <Outlet />}</div>
}));

// Mock react-router-dom to replace BrowserRouter with a simple wrapper
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        BrowserRouter: ({ children }) => <div data-testid="actual-router">{children}</div>,
    };
});

// Mock react Suspense to render children immediately
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
        Suspense: ({ children }) => <div data-testid="suspense">{children}</div>,
    };
});

describe('App Routing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        axios.get.mockResolvedValue({ data: { stripeApiKey: 'test_key' } });
    });

    const renderWithRoute = (route) => {
        window.history.pushState({}, 'Test page', route);
        return render(
            <MemoryRouter initialEntries={[route]}>
                <App />
            </MemoryRouter>
        );
    };

    it('renders layout components (Header and Footer)', async () => {
        renderWithRoute('/');
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('renders home route', async () => {
        renderWithRoute('/');
        expect(await screen.findByTestId('home')).toBeInTheDocument();
    });

    it('renders login route', async () => {
        renderWithRoute('/login');
        expect(await screen.findByTestId('login')).toBeInTheDocument();
    });


    it('renders various other routes', async () => {
        const { cleanup } = require('@testing-library/react');
        const testCases = [
            { path: '/products', id: 'products' },
            { path: '/search', id: 'search' },
            { path: '/password/forgot', id: 'forgot-password' },
            { path: '/contact', id: 'contact' },
            { path: '/about', id: 'about' },
            { path: '/cart', id: 'cart' }
        ];

        for (const testCase of testCases) {
            cleanup();
            renderWithRoute(testCase.path);
            expect(await screen.findByTestId(testCase.id)).toBeInTheDocument();
            expect(screen.getByTestId('header')).toBeInTheDocument();
        }
    });

    it('renders admin routes properly', async () => {
        const { cleanup } = require('@testing-library/react');
        const adminTestCases = [
            { path: '/admin/dashboard', id: 'dashboard' },
            { path: '/admin/products', id: 'product-list' },
            { path: '/admin/orders', id: 'order-list' }
        ];

        for (const testCase of adminTestCases) {
            cleanup();
            renderWithRoute(testCase.path);
            expect(await screen.findByTestId('protected')).toBeInTheDocument();
            expect(screen.getByTestId(testCase.id)).toBeInTheDocument();
        }
    });
});






