import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginSignup from '../component/User/LoginSignup';

// Mock Redux
const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
    ...vi.importActual('react-redux'),
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector({
        user: {
            loading: false,
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


describe('LoginSignup Component', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
    });

    it('renders Login tab by default', () => {
        render(
            <BrowserRouter>
                <LoginSignup />
            </BrowserRouter>
        );

        expect(screen.getByLabelText('Login Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Login Password')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Login/i })).toBeInTheDocument();
    });

    it('switches to Register tab', () => {
        render(
            <BrowserRouter>
                <LoginSignup />
            </BrowserRouter>
        );

        const registerTab = screen.getByRole('tab', { name: /Register/i });
        fireEvent.click(registerTab);

        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    });

    it('dispatches login action', () => {
        render(
            <BrowserRouter>
                <LoginSignup />
            </BrowserRouter>
        );

        const emailInputs = screen.getAllByPlaceholderText('Email');
        const passwordInputs = screen.getAllByPlaceholderText('Password');
        fireEvent.change(emailInputs[0], { target: { value: 'test@email.com' } });
        fireEvent.change(passwordInputs[0], { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        expect(mockDispatch).toHaveBeenCalled();
    });
});
