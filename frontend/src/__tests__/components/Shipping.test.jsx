import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Shipping from '../../component/Cart/Shipping';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockEnqueueSnackbar = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        cart: {
            shippingInfo: { address: '', city: '', state: '', country: '', pinCode: '', phoneNo: '' },
        },
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
vi.mock('../../component/Cart/CheckoutSteps', () => ({ default: () => <div>Steps</div> }));
vi.mock('country-state-city', () => ({
    Country: { getAllCountries: () => [{ isoCode: 'IN', name: 'India' }, { isoCode: 'US', name: 'United States' }] },
    State: { getStatesOfCountry: () => [{ isoCode: 'MH', name: 'Maharashtra' }] },
}));

describe('Shipping', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders shipping form with all fields', () => {
        render(<Shipping />);
        expect(screen.getByText('Shipping Details')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('City')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Pin Code')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Phone Number')).toBeInTheDocument();
    });

    it('renders country dropdown with options', () => {
        render(<Shipping />);
        expect(screen.getByText('India')).toBeInTheDocument();
        expect(screen.getByText('United States')).toBeInTheDocument();
    });

    it('shows state dropdown when country is selected', () => {
        render(<Shipping />);
        const countrySelect = screen.getByDisplayValue('Country');
        fireEvent.change(countrySelect, { target: { value: 'IN' } });
        expect(screen.getByText('Maharashtra')).toBeInTheDocument();
    });

    it('shows error for invalid phone number', () => {
        render(<Shipping />);
        fireEvent.change(screen.getByPlaceholderText('Phone Number'), { target: { value: '123' } });
        fireEvent.change(screen.getByPlaceholderText('Address'), { target: { value: '123 Main' } });
        fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Mumbai' } });
        fireEvent.change(screen.getByPlaceholderText('Pin Code'), { target: { value: '400001' } });

        const countrySelect = screen.getByDisplayValue('Country');
        fireEvent.change(countrySelect, { target: { value: 'IN' } });
        const stateSelect = screen.getByDisplayValue('State');
        fireEvent.change(stateSelect, { target: { value: 'MH' } });

        fireEvent.submit(screen.getByDisplayValue('Continue'));
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'Phone Number should be 10 digits long',
            { variant: 'error' }
        );
    });

    it('renders continue button', () => {
        render(<Shipping />);
        expect(screen.getByDisplayValue('Continue')).toBeInTheDocument();
    });
});
