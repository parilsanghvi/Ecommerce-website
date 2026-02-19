import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ConfirmOrder from '../../component/Cart/ConfirmOrder';
import axios from 'axios';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock MetaData and CheckoutSteps
vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/Cart/CheckoutSteps', () => ({ default: () => <div>Steps</div> }));

// Mock axios
vi.mock('axios');

// Mock MUI
vi.mock('@mui/material', () => ({
    Typography: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

// Mock Redux
vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        cart: {
            shippingInfo: {
                address: '123 Main St',
                city: 'Mumbai',
                state: 'MH',
                pinCode: '400001',
                country: 'IN',
                phoneNo: '9876543210',
            },
            cartItems: [
                { product: 'p1', name: 'Item A', price: 1000, quantity: 2, image: 'img.jpg' },
                { product: 'p2', name: 'Item B', price: 500, quantity: 1, image: 'img2.jpg' },
            ],
        },
        user: {
            user: { name: 'Test User' },
        },
    }),
}));

describe('ConfirmOrder', () => {
    let setItemSpy;

    beforeEach(() => {
        vi.clearAllMocks();
        setItemSpy = vi.spyOn(window.sessionStorage, 'setItem');
    });

    afterEach(() => {
        setItemSpy.mockRestore();
    });

    it('renders shipping info', () => {
        render(<ConfirmOrder />);
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('9876543210')).toBeInTheDocument();
        expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    });

    it('renders cart items', () => {
        render(<ConfirmOrder />);
        expect(screen.getByText('Item A')).toBeInTheDocument();
        expect(screen.getByText('Item B')).toBeInTheDocument();
    });

    it('calculates subtotal correctly', () => {
        render(<ConfirmOrder />);
        // 1000*2 + 500*1 = 2500
        expect(screen.getByText('₹2500')).toBeInTheDocument();
    });

    it('calculates free shipping for orders over 1000', async () => {
        axios.get.mockResolvedValue({
            data: { taxPrice: 450, shippingPrice: 0, totalPrice: 2950 }
        });

        render(<ConfirmOrder />);

        await waitFor(() => {
            const shippingElements = screen.getAllByText('₹0');
            expect(shippingElements.length).toBeGreaterThan(0);
        });
    });

    it('calculates GST (18%)', async () => {
        axios.get.mockResolvedValue({
            data: { taxPrice: 450, shippingPrice: 0, totalPrice: 2950 }
        });

        render(<ConfirmOrder />);

        await waitFor(() => {
             expect(screen.getByText('₹450')).toBeInTheDocument();
        });
    });

    it('calculates total correctly', async () => {
         axios.get.mockResolvedValue({
            data: { taxPrice: 450, shippingPrice: 0, totalPrice: 2950 }
        });

        render(<ConfirmOrder />);

        await waitFor(() => {
            expect(screen.getByText('₹2950')).toBeInTheDocument();
        });
    });

    it('navigates to payment on button click', async () => {
        axios.get.mockResolvedValue({
            data: { taxPrice: 450, shippingPrice: 0, totalPrice: 2950 }
        });

        render(<ConfirmOrder />);

        const button = screen.getByText('Proceed To Payment');
        await waitFor(() => {
            expect(button).not.toBeDisabled();
        });

        fireEvent.click(button);
        expect(mockNavigate).toHaveBeenCalledWith('/process/payment');
    });

    it('stores order info in sessionStorage before payment', async () => {
        axios.get.mockResolvedValue({
            data: { taxPrice: 450, shippingPrice: 0, totalPrice: 2950 }
        });

        render(<ConfirmOrder />);

        const button = screen.getByText('Proceed To Payment');
        await waitFor(() => {
             expect(button).not.toBeDisabled();
        });

        fireEvent.click(button);
        expect(setItemSpy).toHaveBeenCalledWith(
            'orderInfo',
            expect.any(String)
        );
    });
});
