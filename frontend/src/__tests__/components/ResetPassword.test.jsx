import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResetPassword from '../../component/User/ResetPassword';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        user: { error: null, success: false, loading: false },
    }),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useParams: () => ({ token: 'reset-token-123' }),
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));

describe('ResetPassword', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders reset password form with both fields', () => {
        render(<ResetPassword />);
        expect(screen.getByText('Update Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Update')).toBeInTheDocument();
    });

    it('dispatches resetPassword on form submit', () => {
        render(<ResetPassword />);
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'newpass123' } });
        fireEvent.submit(screen.getByDisplayValue('Update'));
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('renders update button', () => {
        render(<ResetPassword />);
        expect(screen.getByDisplayValue('Update')).toBeInTheDocument();
    });
});
