import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UpdatePassword from '../component/User/UpdatePassword';

// Mock Redux
const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
    ...vi.importActual('react-redux'),
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector({
        user: {
            loading: false,
            isUpdated: false,
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
    };
});

// Mock MetaData to avoid Helmet context issues
vi.mock('../component/layout/MetaData', () => ({
    default: () => <div>MetaData</div>,
}));

describe('UpdatePassword Component UX', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
    });

    it('toggles password visibility for old password', () => {
        render(
            <BrowserRouter>
                <UpdatePassword />
            </BrowserRouter>
        );

        const oldPasswordInput = screen.getByPlaceholderText('Old Password');
        expect(oldPasswordInput).toHaveAttribute('type', 'password');

        // Look for the toggle button specifically associated with old password
        // Since we haven't implemented it yet, this test is expected to fail initially or we need to find it by a generic way first if we were TDDing strictly.
        // However, we will look for the button by its aria-label which we plan to add.
        const toggleBtn = screen.getByLabelText('Show old password');
        fireEvent.click(toggleBtn);

        expect(oldPasswordInput).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText('Hide old password')).toBeInTheDocument();

        fireEvent.click(toggleBtn);
        expect(oldPasswordInput).toHaveAttribute('type', 'password');
    });

    it('toggles password visibility for new password', () => {
        render(
            <BrowserRouter>
                <UpdatePassword />
            </BrowserRouter>
        );

        const newPasswordInput = screen.getByPlaceholderText('New Password');
        expect(newPasswordInput).toHaveAttribute('type', 'password');

        const toggleBtn = screen.getByLabelText('Show new password');
        fireEvent.click(toggleBtn);

        expect(newPasswordInput).toHaveAttribute('type', 'text');
    });

    it('toggles password visibility for confirm password', () => {
        render(
            <BrowserRouter>
                <UpdatePassword />
            </BrowserRouter>
        );

        const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');

        const toggleBtn = screen.getByLabelText('Show confirm password');
        fireEvent.click(toggleBtn);

        expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
});
