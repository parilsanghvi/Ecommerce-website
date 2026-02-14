import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import About from '../../component/layout/About/About';

vi.mock('@mui/material', () => ({
    Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
    Typography: ({ children, ...props }) => <span {...props}>{children}</span>,
    Avatar: ({ alt, src }) => <img alt={alt} src={src} />,
}));
vi.mock('@mui/icons-material/LinkedIn', () => ({ default: () => <span>LinkedIn Icon</span> }));
vi.mock('@mui/icons-material/GitHub', () => ({ default: () => <span>GitHub Icon</span> }));

describe('About', () => {
    it('renders About Me heading', () => {
        render(<About />);
        expect(screen.getByText('About Me')).toBeInTheDocument();
    });

    it('renders founder name', () => {
        render(<About />);
        expect(screen.getByText('Paril Sanghvi')).toBeInTheDocument();
    });

    it('renders Visit GitHub button', () => {
        render(<About />);
        expect(screen.getByText('Visit GitHub')).toBeInTheDocument();
    });

    it('renders Connect section', () => {
        render(<About />);
        expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    it('renders social links', () => {
        render(<About />);
        const linkedinLink = screen.getByText('LinkedIn Icon').closest('a');
        expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/paril-sanghvi-38627b217/');
        const githubLink = screen.getByText('GitHub Icon').closest('a');
        expect(githubLink).toHaveAttribute('href', 'https://github.com/Thunderer0');
    });

    it('renders avatar image', () => {
        render(<About />);
        expect(screen.getByAltText('Founder')).toBeInTheDocument();
    });
});
