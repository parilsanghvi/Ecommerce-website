const userController = require('../controllers/userController');
const User = require('../models/userModel');
const sendEmail = require('../utlis/sendEmail');

jest.mock('../models/userModel');
jest.mock('../utlis/sendEmail');

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

    it('should use Host header when FRONTEND_URL is not set (Vulnerability Reproduction)', async () => {
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

        // Verify sendEmail was called
        expect(sendEmail).toHaveBeenCalled();
        const emailOptions = sendEmail.mock.calls[0][0];

        // The vulnerability: link uses evil.com
        expect(emailOptions.message).toContain('http://evil.com/password/reset/dummyToken');
    });

    it('should use FRONTEND_URL when set (Fix Verification)', async () => {
        // Set secure frontend URL
        process.env.FRONTEND_URL = 'https://myshop.com';

        // Mock user found
        const mockUser = {
            email: 'test@example.com',
            getResetPasswordToken: jest.fn().mockReturnValue('dummyToken'),
            save: jest.fn(),
        };
        User.findOne.mockResolvedValue(mockUser);

        // Inject malicious host (should be ignored if fix works)
        req.get.mockReturnValue('evil.com');

        await userController.forgotPassword(req, res, next);

        // Verify sendEmail was called
        expect(sendEmail).toHaveBeenCalled();
        const emailOptions = sendEmail.mock.calls[0][0]; // Helper to get the first arg of the first call, assuming verify works.

        // This expectation will FAIL until I implement the fix
        // Once fixed, it should pass
        expect(emailOptions.message).toContain('https://myshop.com/password/reset/dummyToken');
    });
});
