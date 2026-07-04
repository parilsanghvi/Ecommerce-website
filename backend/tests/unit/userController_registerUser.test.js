const userController = require('../../controllers/userController');
const User = require('../../models/userModel');
const cloudinary = require('cloudinary');
const ErrorHandler = require('../../utils/errorhandler');
const sendToken = require('../../utils/jwtToken');

// Mock dependencies
jest.mock('../../models/userModel');
jest.mock('../../utils/jwtToken');
// Mock catchAsyncErrors
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

describe('registerUser Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                avatar: 'data:image/jpeg;base64,validavatar'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should register user successfully with valid avatar', async () => {
        cloudinary.v2.uploader.upload.mockResolvedValue({
            public_id: 'new_public_id',
            secure_url: 'new_secure_url'
        });

        User.create.mockResolvedValue({
            _id: 'user123',
            name: 'Test User',
            email: 'test@example.com'
        });

        await userController.registerUser(req, res, next);

        expect(cloudinary.v2.uploader.upload).toHaveBeenCalledWith('data:image/jpeg;base64,validavatar', {
            folder: "avatars",
            width: 150,
            crop: "scale",
        });

        expect(User.create).toHaveBeenCalledWith({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            avatar: {
                public_id: 'new_public_id',
                url: 'new_secure_url',
            }
        });

        expect(sendToken).toHaveBeenCalledWith(
            expect.objectContaining({ _id: 'user123' }),
            201,
            res
        );
    });

    it('should fail if avatar is missing', async () => {
        req.body.avatar = undefined;

        await userController.registerUser(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].statusCode).toBe(401);
        expect(next.mock.calls[0][0].message).toBe("Please upload avatar");

        // Ensure upload and create were not called
        expect(cloudinary.v2.uploader.upload).not.toHaveBeenCalled();
        expect(User.create).not.toHaveBeenCalled();
        expect(sendToken).not.toHaveBeenCalled();
    });

    it('should fail if avatar size is too large (exceeds MAX_AVATAR_SIZE)', async () => {
        // MAX_AVATAR_SIZE is 3 * 1024 * 1024 = 3145728
        // Create a string slightly larger than MAX_AVATAR_SIZE
        const MAX_AVATAR_SIZE = 3 * 1024 * 1024;
        const largeAvatar = 'a'.repeat(MAX_AVATAR_SIZE + 1);
        req.body.avatar = largeAvatar;

        await userController.registerUser(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toBe("Avatar image size too large");

        // Ensure upload and create were not called
        expect(cloudinary.v2.uploader.upload).not.toHaveBeenCalled();
        expect(User.create).not.toHaveBeenCalled();
        expect(sendToken).not.toHaveBeenCalled();
    });
});
