const ErrorHandler = require('../../utils/errorhandler');

describe('ErrorHandler', () => {
    it('should correctly set the message and statusCode', () => {
        const message = 'Resource not found';
        const statusCode = 404;

        const error = new ErrorHandler(message, statusCode);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ErrorHandler);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(statusCode);
    });

    it('should capture the stack trace', () => {
        const error = new ErrorHandler('Internal Server Error', 500);

        expect(error.stack).toBeDefined();
        // The stack trace might not contain "ErrorHandler" explicitly depending on the engine
        // Let's check it's a string and starts with Error:
        expect(typeof error.stack).toBe('string');
        expect(error.stack.startsWith('Error')).toBe(true);
    });
});
