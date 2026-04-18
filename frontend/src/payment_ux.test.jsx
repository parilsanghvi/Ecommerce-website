import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { configureStore } from '@reduxjs/toolkit';
import { SnackbarProvider } from 'notistack';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

import Payment from './component/Cart/Payment';
import userReducer from './features/userSlice';
import cartReducer from './features/cartSlice';
import orderReducer from './features/orderSlice';
import productReducer from './features/productSlice';

vi.mock('axios');

const stripePromise = loadStripe('pk_test_dummy');

const createStore = () => configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    order: orderReducer,
    product: productReducer,
  },
  preloadedState: {
    user: { user: { name: 'Test User', email: 'test@example.com' } },
    cart: {
      cartItems: [{ product: '1', quantity: 1, price: 100 }],
      shippingInfo: { address: '123 Main', city: 'City', state: 'State', country: 'IN', pinCode: '123456', phoneNo: '1234567890' },
    },
    order: { error: null },
  },
});

describe('Payment Component UX', () => {
  beforeEach(() => {
    sessionStorage.setItem('orderInfo', JSON.stringify({ subtotal: 100, tax: 10, shippingCharges: 0, totalPrice: 110 }));
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
        if (key === 'orderInfo') {
            return JSON.stringify({ subtotal: 100, tax: 10, shippingCharges: 0, totalPrice: 110 })
        }
        if (key === 'cartItems') {
            return JSON.stringify([{ product: '1', quantity: 1, price: 100 }])
        }
        if (key === 'shippingInfo') {
             return JSON.stringify({ address: '123 Main', city: 'City', state: 'State', country: 'IN', pinCode: '123456', phoneNo: '1234567890' })
        }
        return null;
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders a button with a loading spinner when processing', async () => {
    axios.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { client_secret: 'secret' } }), 100)));

    const store = createStore();

    render(
      <Provider store={store}>
        <HelmetProvider>
          <BrowserRouter>
            <SnackbarProvider>
              <Elements stripe={stripePromise}>
                <Payment />
              </Elements>
            </SnackbarProvider>
          </BrowserRouter>
        </HelmetProvider>
      </Provider>
    );

    const payButton = screen.getByRole('button', { name: /Pay now/i });
    expect(payButton).toBeInTheDocument();

    // Check initial state
    expect(payButton).not.toBeDisabled();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    // Trigger submit
    fireEvent.submit(document.querySelector('form.paymentForm'));

    // Loading state
    await waitFor(() => {
      expect(payButton).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
