import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResetPassword from '../component/User/ResetPassword';

// Mock Redux
const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
    ...vi.importActual('react-redux'),
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector({
        user: {
            loading: false,
            success: false,
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
        useParams: () => ({ token: 'mock-token' }),
    };
});

// Mock MetaData to avoid Helmet context issues
vi.mock('../component/layout/MetaData', () => ({
    default: () => <div>MetaData</div>,
}));

describe('ResetPassword Component UX', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
    });

    it('toggles password visibility for new password', () => {
        render(
            <BrowserRouter>
                <ResetPassword />
            </BrowserRouter>
        );

        const newPasswordInput = screen.getByPlaceholderText('New Password');
        expect(newPasswordInput).toHaveAttribute('type', 'password');

        const toggleBtn = screen.getByLabelText('Show password');
        fireEvent.click(toggleBtn);

        expect(newPasswordInput).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

        fireEvent.click(toggleBtn);
        expect(newPasswordInput).toHaveAttribute('type', 'password');
    });

    it('toggles password visibility for confirm password', () => {
        render(
            <BrowserRouter>
                <ResetPassword />
            </BrowserRouter>
        );

        const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');

        const toggleBtn = screen.getByLabelText('Show confirm password');
        fireEvent.click(toggleBtn);

        expect(confirmPasswordInput).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText('Hide confirm password')).toBeInTheDocument();

        fireEvent.click(toggleBtn);
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
});
