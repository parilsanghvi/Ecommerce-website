import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Products from '../component/Product/Products';
import * as productSlice from '../features/productSlice';

// Mock Redux
const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
    ...vi.importActual('react-redux'),
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector({
        product: {
            loading: false,
            error: null,
            products: [],
            productsCount: 0,
            resultPerPage: 8,
            filteredProductsCount: 0
        }
    }),
}));

// Mock Notistack
vi.mock('notistack', () => ({
    useSnackbar: () => ({
        enqueueSnackbar: vi.fn()
    })
}));

// Mock Router
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ keyword: '' }),
    };
});

// Mock children components
vi.mock('../component/Home/ProductCard', () => ({
    default: () => <div>ProductCard</div>,
}));
vi.mock('../component/layout/MetaData', () => ({
    default: () => <div>MetaData</div>,
}));

// Mock MUI Slider to expose onChange and onChangeCommitted
vi.mock('@mui/material/Slider', () => ({
    default: ({ value, onChange, onChangeCommitted, 'aria-labelledby': ariaLabelledBy, 'aria-label': ariaLabel }) => {
        const testId = ariaLabelledBy === 'range-slider' ? 'price-slider' : 'rating-slider';
        const newValue = ariaLabelledBy === 'range-slider' ? [1000, 5000] : 4;

        return (
            <div data-testid={testId}>
                <span data-testid={`${testId}-value`}>{JSON.stringify(value)}</span>
                <button
                    onClick={() => onChange({}, newValue)}
                    aria-label={`Drag ${testId}`}
                >
                    Drag
                </button>
                <button
                    onClick={() => {
                        if (onChangeCommitted) onChangeCommitted({}, newValue);
                    }}
                    aria-label={`Drop ${testId}`}
                >
                    Drop
                </button>
            </div>
        );
    }
}));

// Mock getProduct action
vi.mock('../features/productSlice', async () => {
    const actual = await vi.importActual('../features/productSlice');
    return {
        ...actual,
        getProduct: vi.fn().mockReturnValue({ type: 'product/getProduct' }),
    };
});

describe('Products Component Performance', () => {
    beforeEach(() => {
        mockDispatch.mockClear();
        vi.mocked(productSlice.getProduct).mockClear();
    });

    it('should NOT dispatch getProduct on slider drag (onChange), only on release (onChangeCommitted)', async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <Products />
            </BrowserRouter>
        );

        // Initial render should dispatch once
        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledTimes(1);
        }, { timeout: 1000 });
        vi.mocked(productSlice.getProduct).mockClear();
        mockDispatch.mockClear();

        // Simulate dragging (onChange) multiple times
        // We re-query the element because React re-renders might replace the DOM node
        await user.click(screen.getByLabelText('Drag price-slider'));
        await user.click(screen.getByLabelText('Drag price-slider'));
        await user.click(screen.getByLabelText('Drag price-slider'));

        // Expectation: getProduct should NOT be called during drag
        expect(mockDispatch).not.toHaveBeenCalled();

        // Simulate drop (onChangeCommitted)
        await user.click(screen.getByLabelText('Drop price-slider'));

        // Expectation: getProduct SHOULD be called now
        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledTimes(1);
            expect(vi.mocked(productSlice.getProduct)).toHaveBeenCalledWith(expect.objectContaining({
                price: [1000, 5000] // The value we set in the mock
            }));
        });
    });
});
