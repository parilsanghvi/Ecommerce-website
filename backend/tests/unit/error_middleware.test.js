const errorMiddleware = require('../../middleware/error');
const ErrorHandler = require('../../utils/errorhandler');

describe('Error Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
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

    describe('Security Fix: 500 Error Information Disclosure', () => {
        let originalEnv;

        beforeEach(() => {
            originalEnv = process.env.NODE_ENV;
        });

        afterEach(() => {
            if (originalEnv === undefined) {
                delete process.env.NODE_ENV;
            } else {
                process.env.NODE_ENV = originalEnv;
            }
        });

        it('should leak error message in DEVELOPMENT', () => {
            process.env.NODE_ENV = 'DEVELOPMENT';
            const err = { statusCode: 500, message: "Sensitive Database Error: DB_HOST=127.0.0.1" };
            errorMiddleware(err, req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Sensitive Database Error: DB_HOST=127.0.0.1"
            });
        });

        it('should NOT leak error message in PRODUCTION', () => {
            process.env.NODE_ENV = 'PRODUCTION';
            const err = { statusCode: 500, message: "Sensitive Database Error: DB_HOST=127.0.0.1" };
            errorMiddleware(err, req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "internal server error"
            });
        });

        it('should NOT leak error message in production (lowercase)', () => {
            process.env.NODE_ENV = 'production';
            const err = { statusCode: 500, message: "Sensitive Database Error: DB_HOST=127.0.0.1" };
            errorMiddleware(err, req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "internal server error"
            });
        });
    });
});
