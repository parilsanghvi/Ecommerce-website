const { isAuthenticatedUser, authorizedRoles } = require('../../middleware/auth');
const User = require('../../models/userModel');
const jwt = require('jsonwebtoken');
const ErrorHandler = require('../../utils/errorhandler');

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
        const mockLean = jest.fn().mockResolvedValue(null);
        const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });
        User.findById.mockReturnValue({ select: mockSelect });

        await isAuthenticatedUser(req, res, next);

        // Expect next to be called with an ErrorHandler
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toMatch(/User no longer exists|Please login/i);
    });

    describe('authorizedRoles', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                user: {
                    role: 'user'
                }
            };
            res = {};
            next = jest.fn();
        });

        it('should call next() if user role is authorized', () => {
            req.user.role = 'admin';
            authorizedRoles('admin')(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next(ErrorHandler) if user role is not authorized', () => {
            req.user.role = 'user';
            authorizedRoles('admin')(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
            expect(next.mock.calls[0][0].message).toMatch(/is not allowed to access this resource/);
        });

        it('should allow multiple roles', () => {
            req.user.role = 'editor';
            authorizedRoles('admin', 'editor')(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });
    });
});
