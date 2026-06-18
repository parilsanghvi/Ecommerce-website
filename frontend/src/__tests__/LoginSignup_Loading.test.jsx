import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import LoginSignup from '../component/User/LoginSignup';

// Mock Redux
vi.mock('react-redux', () => ({
    ...vi.importActual('react-redux'),
    useDispatch: () => vi.fn(),
    useSelector: (selector) => selector({
        user: {
            loading: true, // Force loading state
            isAuthenticated: false,
            error: null
        }
    }),
}));

// Mock Notistack
vi.mock('notistack', () => ({
    useSnackbar: () => ({
        enqueueSnackbar: vi.fn()
    })
}));

// Mock Router
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useLocation: () => ({ pathname: '/login', search: '' }),
    };
});

// Mock Material UI CircularProgress
vi.mock('@mui/material', async () => {
    const actual = await vi.importActual('@mui/material');
    return {
        ...actual,
        CircularProgress: () => <span data-testid="circular-progress">Loading...</span>,
    };
});

describe('LoginSignup Loading State', () => {
    it('shows loading state and disables inputs', () => {
        render(
            <BrowserRouter>
                <LoginSignup />
            </BrowserRouter>
        );

        // Check for Login button text
        const loginBtn = screen.getByRole('button', { name: /Logging In.../i });
        expect(loginBtn).toBeInTheDocument();
        expect(loginBtn).toBeDisabled();

        // Check for Register button text (hidden because tab is inactive)
        const registerBtn = screen.getByRole('button', { name: /Registering.../i, hidden: true });
        expect(registerBtn).toBeInTheDocument();
        expect(registerBtn).toBeDisabled();

        // Check inputs are disabled
        // Login inputs (visible)
        expect(screen.getByLabelText('Login Email')).toBeDisabled();
        expect(screen.getByLabelText('Login Password')).toBeDisabled();

        // Register inputs (hidden)
        expect(screen.getByLabelText('Name', { hidden: true })).toBeDisabled();
        expect(screen.getByLabelText('Email', { hidden: true })).toBeDisabled();
        expect(screen.getByLabelText('Password', { hidden: true })).toBeDisabled();
        expect(screen.getByLabelText('Avatar Upload', { hidden: true })).toBeDisabled();

        // Check tabs are disabled
        expect(screen.getByRole('tab', { name: /Login/i })).toBeDisabled();
        expect(screen.getByRole('tab', { name: /Register/i })).toBeDisabled();
    });
});
