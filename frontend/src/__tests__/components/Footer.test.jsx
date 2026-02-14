import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../../component/layout/Footer/Footer';

vi.mock('../../../images/playstore.png', () => ({ default: 'playstore.png' }));
vi.mock('../../../images/Appstore.png', () => ({ default: 'appstore.png' }));

describe('Footer', () => {
    it('renders footer element', () => {
        render(<Footer />);
        expect(screen.getByText('ECOMMERCE')).toBeInTheDocument();
    });

    it('renders download section', () => {
        render(<Footer />);
        expect(screen.getByText('DOWNLOAD OUR APP')).toBeInTheDocument();
        expect(screen.getByText(/Download App for Android and IOS/)).toBeInTheDocument();
    });

    it('renders quality tagline', () => {
        render(<Footer />);
        expect(screen.getByText('High Quality is our first priority')).toBeInTheDocument();
    });

    it('renders copyright', () => {
        render(<Footer />);
        expect(screen.getByText(/Copyrights 2026/)).toBeInTheDocument();
    });

    it('renders social links', () => {
        render(<Footer />);
        expect(screen.getByText('Follow Us')).toBeInTheDocument();
        expect(screen.getByText('Instagram')).toHaveAttribute('href', 'https://www.instagram.com/parilsanghvi');
        expect(screen.getByText('LinkedIn')).toHaveAttribute('href', 'https://www.linkedin.com/in/paril-sanghvi/');
    });

    it('renders store images', () => {
        render(<Footer />);
        expect(screen.getByAltText('playstore')).toBeInTheDocument();
        expect(screen.getByAltText('Appstore')).toBeInTheDocument();
    });
});
