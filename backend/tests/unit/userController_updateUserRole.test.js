// Mock dependencies before requiring controller
jest.mock('cloudinary', () => ({ v2: { uploader: { destroy: jest.fn(), upload: jest.fn() } } }), { virtual: true });
jest.mock('resend', () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send: jest.fn() } })) }), { virtual: true });
jest.mock('../../models/userModel', () => ({
    findByIdAndUpdate: jest.fn(),
}));

// Mock catchAsyncErrors to execute the function directly so we can test it
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

const userController = require('../../controllers/userController');
const User = require('../../models/userModel');
const ErrorHandler = require('../../utils/errorhandler');

describe('updateUserRole Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: {
                id: 'user123'
            },
            body: {
                name: 'Updated Name',
                email: 'updated@example.com',
                role: 'admin'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should update user role and details successfully', async () => {
        // Mock User.findByIdAndUpdate
        User.findByIdAndUpdate.mockResolvedValue({
            _id: 'user123',
            name: 'Updated Name',
            email: 'updated@example.com',
            role: 'admin'
        });

        await userController.updateUserRole(req, res, next);

        // Verify update call
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
            name: 'Updated Name',
            email: 'updated@example.com',
            role: 'admin'
        }, {
            new: true,
            runValidators: true,
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should prevent updating to an invalid role', async () => {
        req.body.role = 'invalid_role';

        await userController.updateUserRole(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toBe("Role can only be user or admin");
        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should handle Database errors gracefully', async () => {
        const error = new Error('Database Error');
        User.findByIdAndUpdate.mockRejectedValue(error);

        await userController.updateUserRole(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
