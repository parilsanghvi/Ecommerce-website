const { isAuthenticatedUser } = require('../middleware/auth');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const ErrorHandler = require('../utils/errorhandler');

jest.mock('../models/userModel');
jest.mock('jsonwebtoken');

describe('isAuthenticatedUser Middleware Security', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            cookies: { token: 'valid_token' },
        };
        res = {};
        next = jest.fn();
    });

    test('should prevent access if user no longer exists', async () => {
        // Mock jwt.verify to return a valid payload
        jwt.verify.mockReturnValue({ id: 'user_id' });

        // Mock User.findById to return null (user deleted)
        const mockLean = jest.fn().mockResolvedValue(null);
        const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });
        User.findById.mockReturnValue({ select: mockSelect });

        await isAuthenticatedUser(req, res, next);

        // Verify that next was called with an error
        const nextArg = next.mock.calls[0][0];

        expect(nextArg).toBeInstanceOf(ErrorHandler);
        expect(nextArg.message).toBe("User no longer exists");
        expect(nextArg.statusCode).toBe(401);
    });
});
