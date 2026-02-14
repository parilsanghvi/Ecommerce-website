import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotFound from '../../component/layout/Not Found/NotFound';

vi.mock('@mui/icons-material/Error', () => ({
    default: () => <span data-testid="error-icon">⚠️</span>,
}));
vi.mock('@mui/material', () => ({
    Typography: ({ children }) => <span>{children}</span>,
}));
vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe('NotFound', () => {
    it('renders page not found message', () => {
        render(<NotFound />);
        expect(screen.getByText(/Page Not Found/)).toBeInTheDocument();
    });

    it('renders error icon', () => {
        render(<NotFound />);
        expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('renders link to home', () => {
        render(<NotFound />);
        expect(screen.getByText('Home')).toHaveAttribute('href', '/');
    });
});
