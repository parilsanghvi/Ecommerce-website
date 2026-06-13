const userController = require('../controllers/userController');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');

jest.mock('../models/userModel');
jest.mock('../utils/sendEmail');

// Mock catchAsyncErrors to just execute the function
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return func(req, res, next);
});

describe('Host Header Injection in forgotPassword', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: { email: 'test@example.com' },
            protocol: 'http',
            get: jest.fn(),
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();

        // Reset env var
        delete process.env.FRONTEND_URL;
    });

    it('should return error when FRONTEND_URL is not set (Security Implementation)', async () => {
        // Mock user found
        const mockUser = {
            email: 'test@example.com',
            getResetPasswordToken: jest.fn().mockReturnValue('dummyToken'),
            save: jest.fn(),
        };
        User.findOne.mockResolvedValue(mockUser);

        // Inject malicious host
        req.get.mockReturnValue('evil.com');

        await userController.forgotPassword(req, res, next);

        // Verify sendEmail was NOT called
        expect(sendEmail).not.toHaveBeenCalled();

        // Verify next was called with an ErrorHandler (Internal Server Error)
        expect(next).toHaveBeenCalled();
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(500);
        expect(errorArg.message).toBe("FRONTEND_URL is not configured on the server.");
    });

    it('should use FRONTEND_URL when set (Verification)', async () => {
        // Set secure frontend URL
        process.env.FRONTEND_URL = 'https://myshop.com';

        // Mock user found
        const mockUser = {
            email: 'test@example.com',
            getResetPasswordToken: jest.fn().mockReturnValue('dummyToken'),
            save: jest.fn(),
        };
        User.findOne.mockResolvedValue(mockUser);

        // Inject malicious host (should be ignored)
        req.get.mockReturnValue('evil.com');

        await userController.forgotPassword(req, res, next);

        // Verify sendEmail was called
        expect(sendEmail).toHaveBeenCalled();
        const emailOptions = sendEmail.mock.calls[0][0]; // Helper to get the first arg of the first call, assuming verify works.

        // This expectation verifies the URL
        // It should pass based on the environment configuration
        expect(emailOptions.message).toContain('https://myshop.com/password/reset/dummyToken');
    });
});
