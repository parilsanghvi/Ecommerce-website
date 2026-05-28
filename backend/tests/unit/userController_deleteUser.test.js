jest.resetModules();

jest.doMock('../../models/userModel', () => {
    return {
        findById: jest.fn(),
        deleteOne: jest.fn(),
        findByIdAndUpdate: jest.fn()
    };
});

jest.doMock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

jest.doMock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
}), { virtual: true });

jest.doMock('crypto', () => ({
    randomBytes: jest.fn(() => ({ toString: jest.fn() })),
    createHash: jest.fn(() => ({ update: jest.fn(() => ({ digest: jest.fn() })) })),
}), { virtual: true });

jest.doMock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}), { virtual: true });

jest.doMock('resend', () => ({
    Resend: jest.fn()
}), { virtual: true });

const ErrorHandler = require('../../utils/errorhandler');
const cloudinary = require('cloudinary');
const User = require('../../models/userModel');
const userController = require('../../controllers/userController');

describe('deleteUser Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: {
                id: '64f8c8d8b8e0e0a4f5f9e8a1',
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();

        jest.spyOn(cloudinary.v2.uploader, 'destroy').mockResolvedValue({ result: 'ok' });
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should delete user and destroy avatar on cloudinary successfully', async () => {
        const mockUser = {
            _id: '64f8c8d8b8e0e0a4f5f9e8a1',
            avatar: {
                public_id: 'avatar_public_id',
            },
            deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 })
        };

        User.findById.mockResolvedValue(mockUser);

        await userController.deleteUser(req, res, next);

        expect(User.findById).toHaveBeenCalledWith('64f8c8d8b8e0e0a4f5f9e8a1');
        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('avatar_public_id');
        expect(mockUser.deleteOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "user deleted successfully"
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return error if user does not exist', async () => {
        User.findById.mockResolvedValue(null);

        await userController.deleteUser(req, res, next);

        expect(User.findById).toHaveBeenCalledWith('64f8c8d8b8e0e0a4f5f9e8a1');
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toBe('user doesnot exist with id of 64f8c8d8b8e0e0a4f5f9e8a1');
        expect(next.mock.calls[0][0].statusCode).toBe(404);
        expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it('should pass error to next middleware if User.findById throws', async () => {
        const mockError = new Error('Database Error');
        User.findById.mockRejectedValue(mockError);

        await userController.deleteUser(req, res, next);

        expect(next).toHaveBeenCalledWith(mockError);
        expect(res.status).not.toHaveBeenCalled();
    });
});
