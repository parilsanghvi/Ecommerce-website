import { vi, describe, it, expect } from 'vitest';
import { createThunkHandler } from '../thunkHandler';

describe('createThunkHandler', () => {
    it('should return the result of the handler on success', async () => {
        const mockHandler = vi.fn().mockResolvedValue('success data');
        const thunk = createThunkHandler(mockHandler);

        const arg = { id: 1 };
        const thunkAPI = {};

        const result = await thunk(arg, thunkAPI);

        expect(mockHandler).toHaveBeenCalledWith(arg, thunkAPI);
        expect(result).toBe('success data');
    });

    it('should call rejectWithValue with response.data.message if available', async () => {
        const error = new Error('Network Error');
        error.response = {
            data: {
                message: 'Custom API error message'
            }
        };
        const mockHandler = vi.fn().mockRejectedValue(error);
        const thunk = createThunkHandler(mockHandler);

        const arg = { id: 1 };
        const thunkAPI = {
            rejectWithValue: vi.fn().mockImplementation((val) => `rejected: ${val}`)
        };

        const result = await thunk(arg, thunkAPI);

        expect(mockHandler).toHaveBeenCalledWith(arg, thunkAPI);
        expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith('Custom API error message');
        expect(result).toBe('rejected: Custom API error message');
    });

    it('should call rejectWithValue with error.message if response.data.message is not available', async () => {
        const error = new Error('Standard Error');
        const mockHandler = vi.fn().mockRejectedValue(error);
        const thunk = createThunkHandler(mockHandler);

        const arg = { id: 1 };
        const thunkAPI = {
            rejectWithValue: vi.fn().mockImplementation((val) => `rejected: ${val}`)
        };

        const result = await thunk(arg, thunkAPI);

        expect(mockHandler).toHaveBeenCalledWith(arg, thunkAPI);
        expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith('Standard Error');
        expect(result).toBe('rejected: Standard Error');
    });

    it('should call rejectWithValue with error.message if response exists but data.message does not', async () => {
        const error = new Error('Fallback Error');
        error.response = {
            data: {
                otherField: 'something'
            }
        };
        const mockHandler = vi.fn().mockRejectedValue(error);
        const thunk = createThunkHandler(mockHandler);

        const arg = { id: 1 };
        const thunkAPI = {
            rejectWithValue: vi.fn().mockImplementation((val) => `rejected: ${val}`)
        };

        const result = await thunk(arg, thunkAPI);

        expect(mockHandler).toHaveBeenCalledWith(arg, thunkAPI);
        expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith('Fallback Error');
        expect(result).toBe('rejected: Fallback Error');
    });
});
