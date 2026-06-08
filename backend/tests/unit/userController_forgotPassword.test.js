// Mock dependencies that are imported globally in controllers/userModel
jest.mock('../../models/userModel', () => {
    return {
        findById: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        estimatedDocumentCount: jest.fn(),
        find: jest.fn(),
    };
});

jest.mock('../../utils/jwtToken', () => jest.fn());

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            destroy: jest.fn(),
            upload: jest.fn(),
        }
    }
}), { virtual: true });

jest.mock('../../utils/sendEmail', () => jest.fn(), { virtual: true });
jest.mock('resend', () => ({ Resend: jest.fn() }), { virtual: true });

jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

// Import after all mocks
const userController = require('../../controllers/userController');
const User = require('../../models/userModel');
const ErrorHandler = require('../../utils/errorhandler');
const sendEmail = require('../../utils/sendEmail');

describe('forgotPassword Controller', () => {
    let req, res, next, mockUser;

    beforeEach(() => {
        req = {
            body: {
                email: 'test@example.com'
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();

        mockUser = {
            _id: 'user123',
            email: 'test@example.com',
            getResetPasswordToken: jest.fn().mockReturnValue('mockResetToken'),
            save: jest.fn().mockResolvedValue(true)
        };

        process.env.FRONTEND_URL = 'http://localhost:3000';
        jest.clearAllMocks();

        // Mock console.error to avoid noise in tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should return success message if user does not exist (prevents user enumeration)', async () => {
        User.findOne.mockResolvedValue(null);

        await userController.forgotPassword(req, res, next);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: `If your email is registered, you will receive a password reset link shortly.`
        });
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should return error if FRONTEND_URL is not configured', async () => {
        delete process.env.FRONTEND_URL;
        User.findOne.mockResolvedValue(mockUser);

        await userController.forgotPassword(req, res, next);

        expect(mockUser.getResetPasswordToken).toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toBe("FRONTEND_URL is not configured on the server.");
        expect(next.mock.calls[0][0].statusCode).toBe(500);
    });

    it('should send email asynchronously and return success immediately', async () => {
        User.findOne.mockResolvedValue(mockUser);
        sendEmail.mockResolvedValue(true);

        await userController.forgotPassword(req, res, next);

        // Wait for the asynchronous email promise to execute
        await new Promise(resolve => setImmediate(resolve));

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(mockUser.getResetPasswordToken).toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });

        expect(sendEmail).toHaveBeenCalledWith({
            email: 'test@example.com',
            subject: 'Ecommerce Password recovery',
            message: expect.stringContaining('http://localhost:3000/password/reset/mockResetToken')
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: `If your email is registered, you will receive a password reset link shortly.`
        });
    });

    it('should handle email sending failure asynchronously and reset user token', async () => {
        User.findOne.mockResolvedValue(mockUser);

        const testError = new Error('Email failed');
        sendEmail.mockRejectedValue(testError);

        await userController.forgotPassword(req, res, next);

        // Wait for all asynchronous promises and callbacks in the controller to execute
        await new Promise(resolve => setImmediate(resolve));
        await new Promise(resolve => setImmediate(resolve));

        // The response should be sent immediately
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: `If your email is registered, you will receive a password reset link shortly.`
        });

        // Verify the token was reset and saved again
        expect(mockUser.resetPasswordToken).toBeUndefined();
        expect(mockUser.resetPasswordExpire).toBeUndefined();
        expect(mockUser.save).toHaveBeenCalledTimes(2);
        expect(console.error).toHaveBeenCalledWith(
            "Failed to send password reset email asynchronously:",
            testError
        );
    });
});
