const userController = require('../../controllers/userController');
const User = require('../../models/userModel');
const cloudinary = require('cloudinary');

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
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));
jest.mock('../../utils/errorhandler');

describe('updateProfile Optimization', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: {
                id: 'user123',
                avatar: {
                    public_id: 'old_public_id',
                    url: 'old_url'
                }
            },
            body: {
                name: 'New Name',
                email: 'new@example.com',
                avatar: 'data:image/png;base64,newavatar'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should NOT call User.findById (optimized) when avatar is updated', async () => {
        // Mock User.findById just in case (though it shouldn't be called)
        User.findById.mockResolvedValue(null);

        // Mock cloudinary upload
        cloudinary.v2.uploader.upload.mockResolvedValue({
            public_id: 'new_public_id',
            secure_url: 'new_secure_url'
        });

        // Mock User.findByIdAndUpdate
        User.findByIdAndUpdate.mockResolvedValue({});

        await userController.updateProfile(req, res, next);

        // Assert that User.findById IS NOT called (optimization verification)
        expect(User.findById).not.toHaveBeenCalled();

        // Verify other expected behaviors
        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('old_public_id');
        expect(User.findByIdAndUpdate).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
