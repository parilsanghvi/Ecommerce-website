import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../../component/Admin/Dashboard';

const mockDispatch = vi.fn();

vi.mock('react-redux', () => ({
    useSelector: (selector) => selector({
        product: {
            products: [
                { _id: 'p1', name: 'A', stock: 5 },
                { _id: 'p2', name: 'B', stock: 0 },
                { _id: 'p3', name: 'C', stock: 10 },
            ],
        },
        order: { totalAmount: 25000, totalOrders: 42 },
        user: { users: [{ _id: 'u1' }, { _id: 'u2' }] },
    }),
    useDispatch: () => mockDispatch,
}));

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock('../../component/layout/MetaData', () => ({ default: () => null }));
vi.mock('../../component/Admin/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('react-chartjs-2', () => ({
    Doughnut: () => <canvas data-testid="doughnut-chart" />,
    Line: () => <canvas data-testid="line-chart" />,
}));
vi.mock('chart.js', () => ({
    Chart: { register: vi.fn() },
    CategoryScale: vi.fn(),
    LinearScale: vi.fn(),
    PointElement: vi.fn(),
    LineElement: vi.fn(),
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
    ArcElement: vi.fn(),
}));
vi.mock('@mui/material', () => ({
    Typography: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

describe('Dashboard', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders Dashboard heading', () => {
        render(<Dashboard />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders total amount', () => {
        render(<Dashboard />);
        expect(screen.getByText(/25000/)).toBeInTheDocument();
    });

    it('renders product count', () => {
        render(<Dashboard />);
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders order count', () => {
        render(<Dashboard />);
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders user count', () => {
        render(<Dashboard />);
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('renders sidebar', () => {
        render(<Dashboard />);
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders charts', () => {
        render(<Dashboard />);
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    });

    it('dispatches 3 actions on mount (products, orders, users)', () => {
        render(<Dashboard />);
        expect(mockDispatch).toHaveBeenCalledTimes(3);
    });

    it('renders admin links', () => {
        render(<Dashboard />);
        const links = screen.getAllByRole('link');
        const hrefs = links.map(l => l.getAttribute('href'));
        expect(hrefs).toContain('/admin/products');
        expect(hrefs).toContain('/admin/orders');
        expect(hrefs).toContain('/admin/users');
    });
});
