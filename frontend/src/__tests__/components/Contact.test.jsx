import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Contact from '../../component/layout/Contact/Contact';

vi.mock('@mui/material', () => ({
    Button: ({ children }) => <button>{children}</button>,
}));

describe('Contact', () => {
    it('renders contact email', () => {
        render(<Contact />);
        expect(screen.getByText(/parilsanghvi@gmail.com/)).toBeInTheDocument();
    });

    it('renders mailto link', () => {
        render(<Contact />);
        const link = screen.getByText(/parilsanghvi@gmail.com/).closest('a') ||
            document.querySelector('a[href="mailto:parilsanghvi@gmail.com"]');
        expect(link).toBeTruthy();
    });
});
