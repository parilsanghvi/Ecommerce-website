const validate = require('../../middleware/validate');
const { z } = require('zod');
const ErrorHandler = require('../../utils/errorhandler');

describe('Validate Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = { body: {} };
        res = {};
        next = jest.fn();
    });

    it('should call next without arguments if validation succeeds', () => {
        const schema = z.object({
            name: z.string(),
        });
        req.body = { name: 'Test User' };

        const middleware = validate(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should call next with ErrorHandler and status 400 if validation fails', () => {
        const schema = z.object({
            age: z.number({
                required_error: "Age is required",
                invalid_type_error: "Age must be a number",
            }),
        });
        req.body = { age: 'not a number' };

        const middleware = validate(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(ErrorHandler);
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Age must be a number');
    });

    it('should combine multiple validation error messages with a comma', () => {
        const schema = z.object({
            username: z.string({ required_error: "Username is required" }),
            email: z.string({ required_error: "Email is required" }).email("Invalid email"),
        });
        req.body = {}; // missing required fields

        const middleware = validate(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(ErrorHandler);
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Username is required, Email is required');
    });
});
