import { renderHook } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useErrorNotification from '../../hooks/useErrorNotification';

// Mock Redux
vi.mock('react-redux', () => ({
    useDispatch: vi.fn(),
}));

// Mock Notistack
vi.mock('notistack', () => ({
    useSnackbar: vi.fn(),
}));

describe('useErrorNotification Hook', () => {
    let mockDispatch;
    let mockEnqueueSnackbar;
    const mockClearAction = vi.fn(() => ({ type: 'CLEAR_ERRORS' }));

    beforeEach(() => {
        vi.clearAllMocks();
        mockDispatch = vi.fn();
        mockEnqueueSnackbar = vi.fn();

        useDispatch.mockReturnValue(mockDispatch);
        useSnackbar.mockReturnValue({ enqueueSnackbar: mockEnqueueSnackbar });
    });

    it('should call enqueueSnackbar and dispatch clearAction when error is present', () => {
        const error = 'Something went wrong';
        renderHook(() => useErrorNotification(error, mockClearAction));

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith(error, { variant: 'error' });
        expect(mockDispatch).toHaveBeenCalledWith(mockClearAction());
    });

    it('should NOT call enqueueSnackbar and dispatch clearAction when error is null', () => {
        renderHook(() => useErrorNotification(null, mockClearAction));

        expect(mockEnqueueSnackbar).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should NOT call enqueueSnackbar and dispatch clearAction when error is undefined', () => {
        renderHook(() => useErrorNotification(undefined, mockClearAction));

        expect(mockEnqueueSnackbar).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should trigger notification when error changes from null to a value', () => {
        const { rerender } = renderHook(
            ({ error }) => useErrorNotification(error, mockClearAction),
            { initialProps: { error: null } }
        );

        expect(mockEnqueueSnackbar).not.toHaveBeenCalled();

        rerender({ error: 'New error' });

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('New error', { variant: 'error' });
        expect(mockDispatch).toHaveBeenCalledWith(mockClearAction());
    });

    it('should not re-trigger if error remains the same', () => {
        const error = 'Stable error';
        const { rerender } = renderHook(
            ({ err }) => useErrorNotification(err, mockClearAction),
            { initialProps: { err: error } }
        );

        expect(mockEnqueueSnackbar).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledTimes(1);

        rerender({ err: error });

        expect(mockEnqueueSnackbar).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
});
