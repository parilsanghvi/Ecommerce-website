import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '../../component/Admin/Sidebar';

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));
vi.mock('../../images/logo.png', () => ({ default: 'logo.png' }));
vi.mock('@mui/icons-material/PostAdd', () => ({ default: () => <span>📦</span> }));
vi.mock('@mui/icons-material/Add', () => ({ default: () => <span>➕</span> }));
vi.mock('@mui/icons-material/ImportExport', () => ({ default: () => <span>↕️</span> }));
vi.mock('@mui/icons-material/ListAlt', () => ({ default: () => <span>📋</span> }));
vi.mock('@mui/icons-material/Dashboard', () => ({ default: () => <span>📊</span> }));
vi.mock('@mui/icons-material/People', () => ({ default: () => <span>👥</span> }));
vi.mock('@mui/icons-material/RateReview', () => ({ default: () => <span>⭐</span> }));

describe('Sidebar', () => {
    it('renders logo linking to home', () => {
        render(<Sidebar />);
        expect(screen.getByAltText('Ecommerce')).toBeInTheDocument();
        expect(screen.getByAltText('Ecommerce').closest('a')).toHaveAttribute('href', '/');
    });

    it('renders Dashboard link', () => {
        render(<Sidebar />);
        expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    });

    it('renders Products link', () => {
        render(<Sidebar />);
        expect(screen.getByText(/Products/)).toBeInTheDocument();
    });

    it('renders Create Product link', () => {
        render(<Sidebar />);
        expect(screen.getByText(/Create Product/)).toBeInTheDocument();
    });

    it('renders Orders link', () => {
        render(<Sidebar />);
        expect(screen.getByText(/Orders/)).toBeInTheDocument();
    });

    it('renders Users link', () => {
        render(<Sidebar />);
        expect(screen.getByText(/Users/)).toBeInTheDocument();
    });

    it('renders Reviews link', () => {
        render(<Sidebar />);
        expect(screen.getByText(/Reviews/)).toBeInTheDocument();
    });

    it('has correct navigation links', () => {
        render(<Sidebar />);
        const links = screen.getAllByRole('link');
        const hrefs = links.map(l => l.getAttribute('href'));
        expect(hrefs).toContain('/');
        expect(hrefs).toContain('/admin/dashboard');
        expect(hrefs).toContain('/admin/products');
        expect(hrefs).toContain('/admin/product');
        expect(hrefs).toContain('/admin/orders');
        expect(hrefs).toContain('/admin/users');
        expect(hrefs).toContain('/admin/reviews');
    });
});
