const userController = require('../../controllers/userController');
const User = require('../../models/userModel');
const ErrorHandler = require('../../utils/errorhandler');
const cloudinary = require('cloudinary');

jest.mock('../../models/userModel', () => {
    return {
        findById: jest.fn(),
    };
});

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            destroy: jest.fn(),
            upload: jest.fn(),
        }
    }
}), { virtual: true });

jest.mock('../../utils/sendEmail', () => jest.fn(), { virtual: true });
jest.mock('../../utils/jwtToken', () => jest.fn(), { virtual: true });
jest.mock('../../utils/apifeatures', () => jest.fn(), { virtual: true });

jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

describe('deleteUser Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: {
                id: 'user123'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should delete user and avatar successfully when user is found', async () => {
        const mockUser = {
            _id: 'user123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
            avatar: {
                public_id: 'avatar123'
            },
            deleteOne: jest.fn().mockResolvedValue(true)
        };

        User.findById.mockResolvedValue(mockUser);
        cloudinary.v2.uploader.destroy.mockResolvedValue(true);

        await userController.deleteUser(req, res, next);

        // Verify the database call to find user
        expect(User.findById).toHaveBeenCalledWith('user123');

        // Verify the cloudinary call to destroy avatar
        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('avatar123');

        // Verify the database call to delete user
        expect(mockUser.deleteOne).toHaveBeenCalled();

        // Verify the response
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "user deleted successfully"
        });

        // Ensure next was not called with an error
        expect(next).not.toHaveBeenCalled();
    });

    it('should return ErrorHandler when user is not found', async () => {
        User.findById.mockResolvedValue(null);

        await userController.deleteUser(req, res, next);

        // Verify the database call to find user
        expect(User.findById).toHaveBeenCalledWith('user123');

        // Verify that next was called with an ErrorHandler
        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg).toBeInstanceOf(ErrorHandler);
        expect(errorArg.message).toBe('user doesnot exist with id of user123');
        expect(errorArg.statusCode).toBe(404);

        // Verify cloudinary and deleteOne were not called
        expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();

        // Verify response was not sent
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle Database errors gracefully', async () => {
        const dbError = new Error('Database connection failed');
        User.findById.mockRejectedValue(dbError);

        await userController.deleteUser(req, res, next);

        expect(User.findById).toHaveBeenCalledWith('user123');

        // Verify that next was called with the database error
        expect(next).toHaveBeenCalledWith(dbError);

        // Verify response was not sent
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
