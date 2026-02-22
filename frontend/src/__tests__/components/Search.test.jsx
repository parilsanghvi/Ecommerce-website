import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Search from '../../component/Product/Search';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock MetaData
vi.mock('../../component/layout/MetaData', () => ({
    default: () => <div>MetaData</div>,
}));

describe('Search', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    it('renders search input and button', () => {
        render(<Search />);
        expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Search')).toBeInTheDocument();
    });

    it('has accessible aria-label', () => {
        render(<Search />);
        expect(screen.getByLabelText('Search products')).toBeInTheDocument();
    });

    it('navigates to /products/{keyword} on submit with keyword', () => {
        render(<Search />);
        const input = screen.getByPlaceholderText('Search products...');
        fireEvent.change(input, { target: { value: 'shoes' } });
        fireEvent.submit(input.closest('form'));
        expect(mockNavigate).toHaveBeenCalledWith('/products/shoes');
    });

    it('navigates to /products on submit with empty keyword', () => {
        render(<Search />);
        fireEvent.submit(screen.getByPlaceholderText('Search products...').closest('form'));
        expect(mockNavigate).toHaveBeenCalledWith('/products');
    });

    it('trims whitespace from keyword before navigating', () => {
        render(<Search />);
        const input = screen.getByPlaceholderText('Search products...');
        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.submit(input.closest('form'));
        expect(mockNavigate).toHaveBeenCalledWith('/products');
    });

    it('auto-focuses the input on mount', () => {
        render(<Search />);
        const input = screen.getByPlaceholderText('Search products...');
        expect(input).toHaveFocus();
    });
});
