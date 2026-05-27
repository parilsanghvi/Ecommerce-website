const errorMiddleware = require('../../middleware/error');
const ErrorHandler = require('../../utils/errorhandler');

describe('Error Middleware', () => {
    let req, res, next;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('should handle default error with 500 status and default message', () => {
        const err = {};
        errorMiddleware(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "internal server error"
        });
    });

    it('should return generic "Internal Server Error" for 500 status in production', () => {
        process.env.NODE_ENV = 'production';
        const err = new Error("Database connection failed completely with sensitive details");
        errorMiddleware(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Internal Server Error"
        });
    });

    it('should return generic "Internal Server Error" for 500 status in PRODUCTION', () => {
        process.env.NODE_ENV = 'PRODUCTION';
        const err = new Error("Database connection failed completely with sensitive details");
        errorMiddleware(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Internal Server Error"
        });
    });

    it('should NOT overwrite message for non-500 errors in production', () => {
        process.env.NODE_ENV = 'production';
        const err = new ErrorHandler("Custom Client Error", 400);
        errorMiddleware(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Custom Client Error"
        });
    });

    it('should handle custom error with specific status and message', () => {
        const err = new ErrorHandler("Custom Error", 418);
        errorMiddleware(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(418);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Custom Error"
        });
    });

    it('should handle CastError (invalid MongoDB ID)', () => {
        const err = { name: "CastError", path: "id_field" };
        errorMiddleware(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "resource not found. invalid: id_field"
        });
    });

    it('should handle Duplicate Key Error (code 11000)', () => {
        const err = { code: 11000, keyValue: { email: "duplicate@example.com" } };
        errorMiddleware(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "duplicate email entered "
        });
    });

    it('should handle JsonWebTokenError', () => {
        const err = { name: "JsonWebTokenError" };
        errorMiddleware(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Json Web Token is invalid try again "
        });
    });

    it('should handle TokenExpiredError', () => {
        const err = { name: "TokenExpiredError" };
        errorMiddleware(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Json Web Token is expired try again "
        });
    });

    it('should handle ValidationError', () => {
        const err = {
            name: "ValidationError",
            errors: {
                field1: { message: "Error 1" },
                field2: { message: "Error 2" }
            }
        };
        errorMiddleware(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Error 1, Error 2"
        });
    });
});
