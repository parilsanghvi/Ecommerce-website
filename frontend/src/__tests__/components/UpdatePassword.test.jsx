import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UpdatePassword from '../../component/User/UpdatePassword';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

import * as reactRedux from 'react-redux';

vi.mock('react-redux', () => ({
    useSelector: vi.fn(),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));

describe('UpdatePassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        reactRedux.useSelector.mockImplementation((selector) => selector({
            user: { error: null, isUpdated: false, loading: false },
        }));
    });

    it('renders update password form with three fields', () => {
        render(<UpdatePassword />);
        expect(screen.getByPlaceholderText('Old Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
    });

    it('dispatches updatePassword on submit', () => {
        render(<UpdatePassword />);
        fireEvent.change(screen.getByPlaceholderText('Old Password'), { target: { value: 'old123' } });
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'new123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'new123' } });
        fireEvent.submit(screen.getByRole('button', { name: /change/i }));
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('shows loading state and disables button', () => {
        reactRedux.useSelector.mockImplementation((selector) => selector({
            user: { error: null, isUpdated: false, loading: true },
        }));
        render(<UpdatePassword />);
        const button = screen.getByRole('button', { name: /changing\.\.\./i });
        expect(button).toBeDisabled();
        expect(button).toBeInTheDocument();
    });

    it('renders heading', () => {
        render(<UpdatePassword />);
        expect(screen.getByText('Update Profile')).toBeInTheDocument();
    });
});
