const catchAsyncErrors = require('../../middleware/catchAsyncErrors');

describe('catchAsyncErrors Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {};
        next = jest.fn();
    });

    it('should call the wrapped function with req, res, and next', async () => {
        const mockFunc = jest.fn().mockResolvedValue('success');
        const wrappedFunc = catchAsyncErrors(mockFunc);

        await wrappedFunc(req, res, next);

        expect(mockFunc).toHaveBeenCalledWith(req, res, next);
    });

    it('should not call next with an error if the wrapped function resolves successfully', async () => {
        const mockFunc = jest.fn().mockResolvedValue('success');
        const wrappedFunc = catchAsyncErrors(mockFunc);

        await wrappedFunc(req, res, next);

        expect(next).not.toHaveBeenCalled();
    });

    it('should catch errors from the wrapped async function and pass them to next', async () => {
        const error = new Error('Test Error');
        const mockFunc = jest.fn().mockRejectedValue(error);
        const wrappedFunc = catchAsyncErrors(mockFunc);

        await wrappedFunc(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
