import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReviewCard from '../../component/Product/ReviewCard';

// Mock MUI Rating
vi.mock('@mui/material', () => ({
    Rating: ({ value }) => <span data-testid="rating">Rating: {value}</span>,
}));

// Mock profile image
vi.mock('../../images/Profile.png', () => ({ default: '/mock-profile.png' }));

describe('ReviewCard', () => {
    const mockReview = {
        name: 'John Doe',
        rating: 4,
        comment: 'Great product, highly recommend!',
    };

    it('renders reviewer name', () => {
        render(<ReviewCard review={mockReview} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders review comment', () => {
        render(<ReviewCard review={mockReview} />);
        expect(screen.getByText('Great product, highly recommend!')).toBeInTheDocument();
    });

    it('renders rating component', () => {
        render(<ReviewCard review={mockReview} />);
        expect(screen.getByTestId('rating')).toBeInTheDocument();
    });

    it('renders profile image', () => {
        render(<ReviewCard review={mockReview} />);
        expect(screen.getByAltText('User')).toBeInTheDocument();
    });
});
