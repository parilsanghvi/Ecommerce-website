import { describe, it, expect, vi } from 'vitest';
import { createThunkHandler } from '../../utils/thunkHandler';

describe('createThunkHandler', () => {
    it('should call the handler and return its result on success', async () => {
        const handler = vi.fn().mockResolvedValue('success');
        const thunkAPI = { rejectWithValue: vi.fn() };
        const arg = { id: 1 };

        const wrappedHandler = createThunkHandler(handler);
        const result = await wrappedHandler(arg, thunkAPI);

        expect(handler).toHaveBeenCalledWith(arg, thunkAPI);
        expect(result).toBe('success');
        expect(thunkAPI.rejectWithValue).not.toHaveBeenCalled();
    });

    it('should catch error and call rejectWithValue with response message (Axios error simulation)', async () => {
        const error = {
            response: {
                data: {
                    message: 'Axios Error Simulation Message'
                }
            }
        };
        const handler = vi.fn().mockRejectedValue(error);
        const thunkAPI = { rejectWithValue: vi.fn() };
        const arg = { id: 1 };

        const wrappedHandler = createThunkHandler(handler);
        await wrappedHandler(arg, thunkAPI);

        expect(handler).toHaveBeenCalledWith(arg, thunkAPI);
        expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith('Axios Error Simulation Message');
    });

    it('should catch error and call rejectWithValue with default message if response is missing', async () => {
        const error = { message: 'Network Error' };
        const handler = vi.fn().mockRejectedValue(error);
        const thunkAPI = { rejectWithValue: vi.fn() };
        const arg = { id: 1 };

        const wrappedHandler = createThunkHandler(handler);
        await wrappedHandler(arg, thunkAPI);

        expect(handler).toHaveBeenCalledWith(arg, thunkAPI);
        expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith('Network Error');
    });

    it('should catch error and call rejectWithValue with stringified error as fallback', async () => {
        const error = { toString: () => 'Stringified Error' };
        const handler = vi.fn().mockRejectedValue(error);
        const thunkAPI = { rejectWithValue: vi.fn() };
        const arg = { id: 1 };

        const wrappedHandler = createThunkHandler(handler);
        await wrappedHandler(arg, thunkAPI);

        expect(handler).toHaveBeenCalledWith(arg, thunkAPI);
        expect(thunkAPI.rejectWithValue).toHaveBeenCalledWith('Stringified Error');
    });
});
