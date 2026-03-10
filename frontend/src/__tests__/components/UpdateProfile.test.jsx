import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UpdateProfile from '../../component/User/UpdateProfile';

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

describe('UpdateProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        reactRedux.useSelector.mockImplementation((selector) => selector({
            user: {
                user: { name: 'John Doe', email: 'john@test.com', avatar: { url: 'https://example.com/avatar.jpg' } },
                error: null,
                isUpdated: false,
                loading: false,
            },
        }));
    });

    it('renders update profile form', () => {
        render(<UpdateProfile />);
        expect(screen.getByText('Update Profile')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    it('pre-fills with current user data', () => {
        render(<UpdateProfile />);
        expect(screen.getByPlaceholderText('Name')).toHaveValue('John Doe');
        expect(screen.getByPlaceholderText('Email')).toHaveValue('john@test.com');
    });

    it('renders avatar preview', () => {
        render(<UpdateProfile />);
        expect(screen.getByAltText('Avatar Preview')).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('dispatches updateProfile on submit', () => {
        render(<UpdateProfile />);
        const button = screen.getByRole('button', { name: /update/i });
        fireEvent.submit(button);
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('shows loading state and disables button', () => {
        reactRedux.useSelector.mockImplementation((selector) => selector({
            user: {
                user: { name: 'John Doe', email: 'john@test.com', avatar: { url: 'https://example.com/avatar.jpg' } },
                error: null,
                isUpdated: false,
                loading: true,
            },
        }));
        render(<UpdateProfile />);
        const button = screen.getByRole('button', { name: /updating\.\.\./i });
        expect(button).toBeDisabled();
        expect(button).toBeInTheDocument();
    });

});
