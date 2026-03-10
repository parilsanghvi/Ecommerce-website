import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPassword from '../../component/User/ForgotPassword';

const mockDispatch = vi.fn();
const mockEnqueueSnackbar = vi.fn();

import * as reactRedux from 'react-redux';

vi.mock('react-redux', () => ({
    useSelector: vi.fn(),
    useDispatch: () => mockDispatch,
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));

describe('ForgotPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        reactRedux.useSelector.mockImplementation((selector) => selector({
            user: { error: null, message: null, loading: false },
        }));
    });

    it('renders forgot password form', () => {
        render(<ForgotPassword />);
        expect(screen.getByText('Forgot Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('dispatches forgotPassword on submit', () => {
        render(<ForgotPassword />);
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
        fireEvent.submit(screen.getByRole('button', { name: /send/i }));
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('shows loading state and disables button', () => {
        reactRedux.useSelector.mockImplementation((selector) => selector({
            user: { error: null, message: null, loading: true },
        }));
        render(<ForgotPassword />);
        const button = screen.getByRole('button', { name: /sending\.\.\./i });
        expect(button).toBeDisabled();
        expect(button).toBeInTheDocument();
    });

    it('updates email state on input change', () => {
        render(<ForgotPassword />);
        const input = screen.getByPlaceholderText('Email');
        fireEvent.change(input, { target: { value: 'user@example.com' } });
        expect(input.value).toBe('user@example.com');
    });
});
