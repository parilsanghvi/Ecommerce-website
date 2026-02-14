import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrderSuccess from '../../component/Cart/OrderSuccess';

vi.mock('@mui/icons-material/CheckCircle', () => ({
    default: () => <span data-testid="check-icon">✓</span>,
}));
vi.mock('@mui/material', () => ({
    Typography: ({ children }) => <span>{children}</span>,
}));
vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe('OrderSuccess', () => {
    it('renders success message', () => {
        render(<OrderSuccess />);
        expect(screen.getByText(/Your Order has been Placed successfully/)).toBeInTheDocument();
    });

    it('renders check icon', () => {
        render(<OrderSuccess />);
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('renders link to view orders', () => {
        render(<OrderSuccess />);
        const link = screen.getByText('View Orders');
        expect(link).toHaveAttribute('href', '/orders');
    });
});
