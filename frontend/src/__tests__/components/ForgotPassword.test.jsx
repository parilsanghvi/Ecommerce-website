import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPassword from '../../component/User/ForgotPassword';

const mockDispatch = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        user: { error: null, message: null, loading: false },
    }),
    useDispatch: () => mockDispatch,
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));

describe('ForgotPassword', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders forgot password form', () => {
        render(<ForgotPassword />);
        expect(screen.getByText('Forgot Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Send')).toBeInTheDocument();
    });

    it('dispatches forgotPassword on submit', () => {
        render(<ForgotPassword />);
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
        fireEvent.submit(screen.getByDisplayValue('Send'));
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('updates email state on input change', () => {
        render(<ForgotPassword />);
        const input = screen.getByPlaceholderText('Email');
        fireEvent.change(input, { target: { value: 'user@example.com' } });
        expect(input.value).toBe('user@example.com');
    });
});
