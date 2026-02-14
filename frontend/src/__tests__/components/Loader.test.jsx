import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Loader from '../../component/layout/Loader';

describe('Loader', () => {
    it('renders loading container', () => {
        const { container } = render(<Loader />);
        expect(container.querySelector('.loading')).toBeInTheDocument();
    });

    it('renders inner div', () => {
        const { container } = render(<Loader />);
        const loadingDiv = container.querySelector('.loading');
        expect(loadingDiv.querySelector('div')).toBeInTheDocument();
    });
});
