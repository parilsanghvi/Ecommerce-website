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
const sendToken = require('../../utils/jwtToken');

describe('updatePassword Controller', () => {
    let req, res, next, mockUser;

    beforeEach(() => {
        req = {
            user: {
                _id: 'user123'
            },
            body: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();

        mockUser = {
            _id: 'user123',
            password: 'oldHashedPassword',
            comparePassword: jest.fn(),
            save: jest.fn()
        };

        // Setup User.findById().select() chain
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser)
        });

        jest.clearAllMocks();
    });

    it('should update password successfully when inputs are valid', async () => {
        req.body = {
            oldPassword: 'oldPassword123',
            newPassword: 'newPassword123',
            confirmPassword: 'newPassword123'
        };

        mockUser.comparePassword.mockResolvedValue(true);
        mockUser.save.mockResolvedValue(mockUser);

        await userController.updatePassword(req, res, next);

        expect(User.findById).toHaveBeenCalledWith('user123');
        expect(mockUser.comparePassword).toHaveBeenCalledWith('oldPassword123');
        expect(mockUser.password).toBeUndefined();
        expect(mockUser.save).toHaveBeenCalled();
        expect(sendToken).toHaveBeenCalledWith(mockUser, 200, res);
        expect(next).not.toHaveBeenCalled();
    });

    it('should return error if old password does not match', async () => {
        req.body = {
            oldPassword: 'wrongOldPassword',
            newPassword: 'newPassword123',
            confirmPassword: 'newPassword123'
        };

        mockUser.comparePassword.mockResolvedValue(false);

        await userController.updatePassword(req, res, next);

        expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongOldPassword');
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toBe("old password is incorrect ");
        expect(next.mock.calls[0][0].statusCode).toBe(401);
        expect(mockUser.save).not.toHaveBeenCalled();
        expect(sendToken).not.toHaveBeenCalled();
    });

    it('should return error if new password and confirm password do not match', async () => {
        req.body = {
            oldPassword: 'oldPassword123',
            newPassword: 'newPassword123',
            confirmPassword: 'differentPassword'
        };

        mockUser.comparePassword.mockResolvedValue(true);

        await userController.updatePassword(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toBe("password doesnot match");
        expect(next.mock.calls[0][0].statusCode).toBe(401);
        expect(mockUser.save).not.toHaveBeenCalled();
        expect(sendToken).not.toHaveBeenCalled();
    });

    it('should pass database errors to next()', async () => {
        req.body = {
            oldPassword: 'oldPassword123',
            newPassword: 'newPassword123',
            confirmPassword: 'newPassword123'
        };

        mockUser.comparePassword.mockResolvedValue(true);

        const dbError = new Error("Database save error");
        mockUser.save.mockRejectedValue(dbError);

        await userController.updatePassword(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
        expect(sendToken).not.toHaveBeenCalled();
    });
});
