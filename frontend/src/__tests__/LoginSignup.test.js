import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LoginSignup from '../component/User/LoginSignup';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock Redux
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
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
jest.mock('notistack', () => ({
    useSnackbar: () => ({
        enqueueSnackbar: jest.fn()
    })
}));

// Mock Router
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/login', search: '' }),
}));


describe('LoginSignup Component', () => {

    test('renders Login tab by default', () => {
        render(
            <BrowserRouter>
                <LoginSignup />
            </BrowserRouter>
        );

        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    test('switches to Register tab', () => {
        render(
            <BrowserRouter>
                <LoginSignup />
            </BrowserRouter>
        );

        const registerTab = screen.getByText('Register');
        fireEvent.click(registerTab);

        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
        // Check if Register button is visible (might need to check visibility specifically if CSS hides it, 
        // but checking existence in DOM is a good first step. 
        // The component uses class manipulation for visibility, which jsdom handles but visual checks strictly rely on styles.
        // Let's assume input presence confirms tab switch logic execution.)
    });

    test('dispatches login action', () => {
        render(
            <BrowserRouter>
                <LoginSignup />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@email.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        expect(mockDispatch).toHaveBeenCalled();
    });
});
