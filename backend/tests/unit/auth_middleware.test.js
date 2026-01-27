const { isAuthenticatedUser } = require('../../middleware/auth');
const User = require('../../models/userModel');
const jwt = require('jsonwebtoken');
const ErrorHandler = require('../../utlis/errorhandler');

jest.mock('../../models/userModel');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            cookies: {
                token: 'validtoken'
            }
        };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'testsecret';
    });

    it('should call next with error if user is deleted (User.findById returns null)', async () => {
        // Mock JWT verification to return a valid ID
        jwt.verify.mockReturnValue({ id: 'user123' });

        // Mock User.findById to return null (user deleted)
        User.findById.mockResolvedValue(null);

        await isAuthenticatedUser(req, res, next);

        // Expect next to be called with an ErrorHandler
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toMatch(/User no longer exists|Please login/i);
    });
});
