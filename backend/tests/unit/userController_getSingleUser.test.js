const userController = require('../../controllers/userController');
const User = require('../../models/userModel');
const ErrorHandler = require('../../utils/errorhandler');

// Mock dependencies
// Note: We need to mock the entire model path virtually if mongoose is missing,
// but since this is unit tests, let's follow the established pattern.
// In userController_updateProfile.test.js they just did jest.mock('../../models/userModel')
// However, the error says 'Cannot find module mongoose from userModel.js'
// Let's use virtual mock to avoid requiring the file at all
jest.mock('../../models/userModel', () => {
    return {
        findById: jest.fn(),
    };
});

// Also need to mock other dependencies used in userController
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

// Mock catchAsyncErrors to execute the function directly so we can test it
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

describe('getSingleUser Controller', () => {
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

    it('should return user details when user is found', async () => {
        const mockUser = {
            _id: 'user123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user'
        };

        // Mock User.findById to return a query object with lean()
        const mockFindById = {
            lean: jest.fn().mockResolvedValue(mockUser)
        };
        User.findById.mockReturnValue(mockFindById);

        await userController.getSingleUser(req, res, next);

        // Verify the database call
        expect(User.findById).toHaveBeenCalledWith('user123');
        expect(mockFindById.lean).toHaveBeenCalled();

        // Verify the response
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            user: mockUser
        });

        // Ensure next was not called with an error
        expect(next).not.toHaveBeenCalled();
    });

    it('should return ErrorHandler when user is not found', async () => {
        // Mock User.findById to return null via lean()
        const mockFindById = {
            lean: jest.fn().mockResolvedValue(null)
        };
        User.findById.mockReturnValue(mockFindById);

        await userController.getSingleUser(req, res, next);

        // Verify the database call
        expect(User.findById).toHaveBeenCalledWith('user123');
        expect(mockFindById.lean).toHaveBeenCalled();

        // Verify that next was called with an ErrorHandler
        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg).toBeInstanceOf(ErrorHandler);
        expect(errorArg.message).toBe('user doesnot exist with id: user123');
        expect(errorArg.statusCode).toBe(400);

        // Verify response was not sent
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle Database errors gracefully', async () => {
        const dbError = new Error('Database connection failed');

        // Mock User.findById to reject via lean()
        const mockFindById = {
            lean: jest.fn().mockRejectedValue(dbError)
        };
        User.findById.mockReturnValue(mockFindById);

        await userController.getSingleUser(req, res, next);

        // Verify the database call
        expect(User.findById).toHaveBeenCalledWith('user123');
        expect(mockFindById.lean).toHaveBeenCalled();

        // Verify that next was called with the database error
        expect(next).toHaveBeenCalledWith(dbError);

        // Verify response was not sent
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
