/**
 * Wraps an async function with standard error handling for Redux Toolkit thunks.
 *
 * @param {Function} handler - The async function to execute.
 * @returns {Function} - A thunk payload creator that catches errors and calls rejectWithValue.
 */
export const createThunkHandler = (handler) => async (arg, thunkAPI) => {
    try {
        return await handler(arg, thunkAPI);
    } catch (error) {
        const message =
            error.response && error.response.data && error.response.data.message
                ? error.response.data.message
                : error.message;
        return thunkAPI.rejectWithValue(message);
    }
};
