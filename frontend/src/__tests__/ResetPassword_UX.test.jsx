import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { configureStore } from '@reduxjs/toolkit';
import { SnackbarProvider } from 'notistack';
import { vi, describe, it, expect } from 'vitest';

import ResetPassword from '../component/User/ResetPassword';
import userReducer from '../features/userSlice';

const createStore = () => configureStore({
  reducer: {
    user: userReducer,
  },
  preloadedState: {
    user: { loading: false, error: null, success: false },
  },
});

describe('ResetPassword Component UX', () => {
  it('toggles password visibility', () => {
    const store = createStore();

    render(
      <Provider store={store}>
        <HelmetProvider>
          <BrowserRouter>
            <SnackbarProvider>
              <ResetPassword />
            </SnackbarProvider>
          </BrowserRouter>
        </HelmetProvider>
      </Provider>
    );

    // Initial state: password input should have type="password"
    const newPasswordInput = screen.getByPlaceholderText('New Password');
    expect(newPasswordInput).toHaveAttribute('type', 'password');

    // Find the toggle button
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    // Click to show password
    fireEvent.click(toggleButton);

    // After click: password input should have type="text"
    expect(newPasswordInput).toHaveAttribute('type', 'text');

    // The aria-label on the button should update
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');

    // Click again to hide password
    fireEvent.click(toggleButton);
    expect(newPasswordInput).toHaveAttribute('type', 'password');
  });
});
