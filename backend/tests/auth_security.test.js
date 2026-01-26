const { isAuthenticatedUser } = require('../middleware/auth');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const ErrorHandler = require('../utlis/errorhandler');

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
        User.findById.mockResolvedValue(null);

        await isAuthenticatedUser(req, res, next);

        // If the vulnerability exists, next() is called without error
        // If fixed, next(error) is called

        // We expect it to FAIL currently (so next is called with undefined)
        // But we want to assert what SHOULD happen.
        // For reproduction, we can assert that it IS CALLED (which means it passed auth)
        // OR we can assert that it passed with error (which it won't).

        // Let's check what arguments next was called with
        const nextArg = next.mock.calls[0][0];

        // If nextArg is undefined, it means success (bypass)
        // If nextArg is ErrorHandler, it means secure

        if (!nextArg) {
             console.log("VULNERABILITY CONFIRMED: Auth passed for deleted user");
        }

        expect(nextArg).toBeInstanceOf(ErrorHandler);
    });
});
