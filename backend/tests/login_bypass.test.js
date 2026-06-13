const userController = require('../controllers/userController');
const User = require('../models/userModel');
const sendToken = require('../utils/jwtToken');

// Mock dependencies
jest.mock('../models/userModel');
jest.mock('../utils/jwtToken', () => jest.fn()); // Mock as a function directly
jest.mock('../utils/sendEmail');
jest.mock('cloudinary');

describe('Login Authentication Bypass', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {
                email: 'test@example.com',
                password: 'wrongpassword'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should NOT call sendToken when password is invalid', async () => {
        // Setup mock user
        const mockUser = {
            comparePassword: jest.fn().mockResolvedValue(false), // Password mismatch
            select: jest.fn().mockReturnThis()
        };
        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser)
        });

        await userController.loginUser(req, res, next);

        // Wait for async operations inside loginUser to complete
        await new Promise(process.nextTick);

        // CRITICAL CHECK: sendToken should NOT be called
        // This confirms the authentication bypass is resolved
        expect(sendToken).not.toHaveBeenCalled();

        // Also verify next was called with ErrorHandler (sanity check)
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            message: "Invalid email or password",
            statusCode: 401
        }));
    });

    it('should NOT call sendToken (and not crash) when user is not found', async () => {
        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        });

        await userController.loginUser(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            message: "Invalid email or password",
            statusCode: 401
        }));
        expect(sendToken).not.toHaveBeenCalled();
    });
});
