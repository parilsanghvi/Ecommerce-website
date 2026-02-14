import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UpdatePassword from '../../component/User/UpdatePassword';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        user: { error: null, isUpdated: false, loading: false },
    }),
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
    beforeEach(() => vi.clearAllMocks());

    it('renders update password form with three fields', () => {
        render(<UpdatePassword />);
        expect(screen.getByPlaceholderText('Old Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Change')).toBeInTheDocument();
    });

    it('dispatches updatePassword on submit', () => {
        render(<UpdatePassword />);
        fireEvent.change(screen.getByPlaceholderText('Old Password'), { target: { value: 'old123' } });
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'new123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'new123' } });
        fireEvent.submit(screen.getByDisplayValue('Change'));
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('renders heading', () => {
        render(<UpdatePassword />);
        expect(screen.getByText('Update Profile')).toBeInTheDocument();
    });
});
