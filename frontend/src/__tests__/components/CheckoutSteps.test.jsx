import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CheckoutSteps from '../../component/Cart/CheckoutSteps';

vi.mock('@mui/material', () => ({
    Typography: ({ children }) => <span>{children}</span>,
    Stepper: ({ children, activeStep }) => <div data-testid="stepper" data-active={activeStep}>{children}</div>,
    StepLabel: ({ children, icon }) => <div data-testid="step-label">{icon}{children}</div>,
    Step: ({ children, active, completed }) => (
        <div data-testid="step" data-active={active} data-completed={completed}>{children}</div>
    ),
}));

vi.mock('@mui/icons-material/LocalShipping', () => ({ default: () => <span>🚚</span> }));
vi.mock('@mui/icons-material/LibraryAddCheck', () => ({ default: () => <span>✓</span> }));
vi.mock('@mui/icons-material/AccountBalance', () => ({ default: () => <span>🏦</span> }));

describe('CheckoutSteps', () => {
    it('renders 3 steps', () => {
        render(<CheckoutSteps activeStep={0} />);
        expect(screen.getAllByTestId('step')).toHaveLength(3);
    });

    it('renders SHIPPING, CONFIRM, PAYMENT labels', () => {
        render(<CheckoutSteps activeStep={0} />);
        expect(screen.getByText('SHIPPING')).toBeInTheDocument();
        expect(screen.getByText('CONFIRM')).toBeInTheDocument();
        expect(screen.getByText('PAYMENT')).toBeInTheDocument();
    });

    it('marks first step active when activeStep=0', () => {
        render(<CheckoutSteps activeStep={0} />);
        const steps = screen.getAllByTestId('step');
        expect(steps[0]).toHaveAttribute('data-active', 'true');
    });

    it('marks steps as completed up to activeStep', () => {
        render(<CheckoutSteps activeStep={2} />);
        const steps = screen.getAllByTestId('step');
        expect(steps[0]).toHaveAttribute('data-completed', 'true');
        expect(steps[1]).toHaveAttribute('data-completed', 'true');
        expect(steps[2]).toHaveAttribute('data-completed', 'true');
    });
});
