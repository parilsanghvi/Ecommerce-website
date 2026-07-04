let userController;
let User;
let sendEmail;
let ErrorHandler;

describe('forgotPassword Controller', () => {
    let req, res, next, mockUser;

    beforeEach(() => {
        jest.doMock('../../models/userModel', () => {
            return {
                findById: jest.fn(),
                findOne: jest.fn(),
                create: jest.fn(),
                findByIdAndUpdate: jest.fn(),
                estimatedDocumentCount: jest.fn(),
                find: jest.fn(),
            };
        });

        jest.doMock('../../utils/jwtToken', () => jest.fn());

        jest.doMock('cloudinary', () => ({
            v2: {
                uploader: {
                    destroy: jest.fn(),
                    upload: jest.fn(),
                }
            }
        }), { virtual: true });

        jest.doMock('../../utils/sendEmail', () => jest.fn());
        jest.doMock('resend', () => ({ Resend: jest.fn() }), { virtual: true });

        jest.doMock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
            return Promise.resolve(func(req, res, next)).catch(next);
        });

        userController = require('../../controllers/userController');
        User = require('../../models/userModel');
        sendEmail = require('../../utils/sendEmail');
        ErrorHandler = require('../../utils/errorhandler');

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

        // Wait for all microtasks in the asynchronous email promise chain to execute
        for (let i = 0; i < 10; i++) {
            await Promise.resolve();
        }
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

        // Wait for all microtasks in the asynchronous email failure and save callback chain to execute
        for (let i = 0; i < 10; i++) {
            await Promise.resolve();
        }

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

    it('should log error if saving user fails after email sending failure', async () => {
        User.findOne.mockResolvedValue(mockUser);

        const testError = new Error('Email failed');
        sendEmail.mockRejectedValue(testError);

        const saveError = new Error('Save failed');
        mockUser.save
            .mockResolvedValueOnce(true)
            .mockRejectedValueOnce(saveError);

        await userController.forgotPassword(req, res, next);

        for (let i = 0; i < 10; i++) {
            await Promise.resolve();
        }

        expect(console.error).toHaveBeenCalledWith(
            "Failed to send password reset email asynchronously:",
            testError
        );
        expect(console.error).toHaveBeenCalledWith(
            "Failed to clear reset token after email failure:",
            saveError
        );
    });
});
