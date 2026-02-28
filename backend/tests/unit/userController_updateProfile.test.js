const userController = require('../../controllers/userController');
const User = require('../../models/userModel');
const cloudinary = require('cloudinary');
const ErrorHandler = require('../../utils/errorhandler');

// Mock dependencies
jest.mock('../../models/userModel');
jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            destroy: jest.fn(),
            upload: jest.fn(),
        }
    }
}));
// Mock catchAsyncErrors to execute the function directly so we can test it
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

describe('updateProfile Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: {
                id: 'user123',
                _id: 'user123',
                avatar: {
                    public_id: 'old_public_id',
                    url: 'old_url'
                }
            },
            body: {
                name: 'New Name',
                email: 'new@example.com',
                avatar: ''
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should update name and email without updating avatar', async () => {
        // Mock User.findByIdAndUpdate
        User.findByIdAndUpdate.mockResolvedValue({
            _id: 'user123',
            name: 'New Name',
            email: 'new@example.com',
            avatar: { public_id: 'old_public_id', url: 'old_url' }
        });

        await userController.updateProfile(req, res, next);

        // Verify that avatar logic was skipped
        expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
        expect(cloudinary.v2.uploader.upload).not.toHaveBeenCalled();

        // Verify update call
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
            name: 'New Name',
            email: 'new@example.com',
        }, {
            new: true,
            runValidators: true,
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should update avatar if provided', async () => {
        req.body.avatar = 'data:image/jpeg;base64,newavatar';

        // Mock cloudinary upload and destroy
        cloudinary.v2.uploader.destroy.mockResolvedValue({ result: 'ok' });
        cloudinary.v2.uploader.upload.mockResolvedValue({
            public_id: 'new_public_id',
            secure_url: 'new_secure_url'
        });

        // Mock User.findByIdAndUpdate
        User.findByIdAndUpdate.mockResolvedValue({});

        await userController.updateProfile(req, res, next);

        // Verify avatar logic
        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('old_public_id');
        expect(cloudinary.v2.uploader.upload).toHaveBeenCalledWith('data:image/jpeg;base64,newavatar', {
            folder: "avatars",
            width: 150,
            crop: "scale",
        });

        // Verify update call with new avatar
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
            name: 'New Name',
            email: 'new@example.com',
            avatar: {
                public_id: 'new_public_id',
                url: 'new_secure_url',
            }
        }, {
            new: true,
            runValidators: true,
        });

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should fail if avatar is undefined (missing in body)', async () => {
        // If avatar is missing from body, req.body.avatar is undefined
        req.body.avatar = undefined;

        await userController.updateProfile(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].statusCode).toBe(401);
        expect(next.mock.calls[0][0].message).toBe("Please upload a new avatar");
    });

    it('should handle Cloudinary errors gracefully', async () => {
        req.body.avatar = 'data:image/jpeg;base64,newavatar';

        const error = new Error('Cloudinary Error');
        cloudinary.v2.uploader.destroy.mockRejectedValue(error);

        await userController.updateProfile(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle Database errors gracefully', async () => {
        req.body.avatar = '';
        const error = new Error('Database Error');
        User.findByIdAndUpdate.mockRejectedValue(error);

        await userController.updateProfile(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
