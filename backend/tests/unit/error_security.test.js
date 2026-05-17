const errorMiddleware = require('../../middleware/error');

describe('Error Middleware Security', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should not leak error details in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const err = new Error("Database connection string leaked: mongodb://user:pass@localhost:27017");

        errorMiddleware(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "internal server error"
        });

        process.env.NODE_ENV = originalEnv;
    });
});
