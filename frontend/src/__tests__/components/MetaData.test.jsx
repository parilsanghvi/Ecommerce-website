import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MetaData from '../../component/layout/MetaData';

vi.mock('react-helmet-async', () => ({
    Helmet: ({ children }) => <div data-testid="helmet">{children}</div>,
}));

describe('MetaData', () => {
    it('renders title within Helmet', () => {
        const { getByTestId } = render(<MetaData title="Test Page" />);
        expect(getByTestId('helmet')).toBeInTheDocument();
    });

    it('sets the title text', () => {
        const { getByText } = render(<MetaData title="My Product" />);
        expect(getByText('My Product')).toBeInTheDocument();
    });
});
