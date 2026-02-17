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

    it('renders shipping form with accessible labels', () => {
        render(<Shipping />);
        expect(screen.getByText('Shipping Details')).toBeInTheDocument();

        // Should find inputs by label (aria-label or label tag)
        expect(screen.getByLabelText('Address')).toBeInTheDocument();
        expect(screen.getByLabelText('City')).toBeInTheDocument();
        expect(screen.getByLabelText('Pin Code')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
        expect(screen.getByLabelText('Country')).toBeInTheDocument();
    });

    it('renders country dropdown with options', () => {
        render(<Shipping />);
        expect(screen.getByText('India')).toBeInTheDocument();
        expect(screen.getByText('United States')).toBeInTheDocument();
    });

    it('shows state dropdown when country is selected', () => {
        render(<Shipping />);
        // Use label to find the select
        const countrySelect = screen.getByLabelText('Country');
        fireEvent.change(countrySelect, { target: { value: 'IN' } });
        expect(screen.getByText('Maharashtra')).toBeInTheDocument();
        // State should also be accessible by label
        expect(screen.getByLabelText('State')).toBeInTheDocument();
    });

    it('renders continue button', () => {
        render(<Shipping />);
        expect(screen.getByDisplayValue('Continue')).toBeInTheDocument();
    });
});
