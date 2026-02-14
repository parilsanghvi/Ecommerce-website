import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UpdateUser from '../../component/Admin/UpdateUser';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        user: {
            loading: false, error: null, isUpdated: false, updateLoading: false, updateError: null,
            userDetails: { _id: 'u1', name: 'John Doe', email: 'john@test.com', role: 'user' },
        },
    }),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'u1' }),
}));

vi.mock('notistack', () => ({
    useSnackbar: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/layout/Loader', () => ({ default: () => <div data-testid="loader">Loading...</div> }));
vi.mock('../../component/Admin/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('@mui/material', () => ({
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock('@mui/icons-material/MailOutline', () => ({ default: () => <span>✉️</span> }));
vi.mock('@mui/icons-material/Person', () => ({ default: () => <span>👤</span> }));
vi.mock('@mui/icons-material/VerifiedUser', () => ({ default: () => <span>✔️</span> }));

describe('UpdateUser (Admin)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders Update User heading', () => {
        render(<UpdateUser />);
        expect(screen.getByText('Update User')).toBeInTheDocument();
    });

    it('pre-fills user data', () => {
        render(<UpdateUser />);
        expect(screen.getByPlaceholderText('Name')).toHaveValue('John Doe');
        expect(screen.getByPlaceholderText('Email')).toHaveValue('john@test.com');
    });

    it('renders role dropdown', () => {
        render(<UpdateUser />);
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('renders sidebar', () => {
        render(<UpdateUser />);
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('dispatches on form submit', () => {
        render(<UpdateUser />);
        fireEvent.submit(screen.getByRole('button', { name: /Update/i }));
        expect(mockDispatch).toHaveBeenCalled();
    });
});
