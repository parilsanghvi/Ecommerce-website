const userController = require('../../controllers/userController');
const User = require('../../models/userModel');
const ErrorHandler = require('../../utils/errorhandler');
const sendToken = require('../../utils/jwtToken');

// Mock dependencies
jest.mock('../../models/userModel');
jest.mock('../../utils/jwtToken');

// Mock catchAsyncErrors
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

describe('loginUser Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {
                email: 'test@example.com',
                password: 'password123'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should login user successfully with valid email and password', async () => {
        const mockUser = {
            _id: 'user123',
            name: 'Test User',
            email: 'test@example.com',
            password: 'hashedpassword',
            comparePassword: jest.fn().mockResolvedValue(true)
        };

        const mockSelect = jest.fn().mockResolvedValue(mockUser);
        User.findOne.mockReturnValue({ select: mockSelect });

        await userController.loginUser(req, res, next);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(mockSelect).toHaveBeenCalledWith('+password');
        expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');

        expect(mockUser.password).toBeUndefined();

        expect(sendToken).toHaveBeenCalledWith(
            mockUser,
            200,
            res
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('should fail if email is missing', async () => {
        req.body.email = undefined;

        await userController.loginUser(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].statusCode).toBe(401);
        expect(next.mock.calls[0][0].message).toBe("Please enter email and password");

        expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should fail if password is missing', async () => {
        req.body.password = undefined;

        await userController.loginUser(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].statusCode).toBe(401);
        expect(next.mock.calls[0][0].message).toBe("Please enter email and password");

        expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should fail if user is not found', async () => {
        const mockSelect = jest.fn().mockResolvedValue(null);
        User.findOne.mockReturnValue({ select: mockSelect });

        await userController.loginUser(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].statusCode).toBe(401);
        expect(next.mock.calls[0][0].message).toBe("Invalid email or password");

        expect(sendToken).not.toHaveBeenCalled();
    });

    it('should fail if password does not match', async () => {
        const mockUser = {
            _id: 'user123',
            name: 'Test User',
            email: 'test@example.com',
            password: 'hashedpassword',
            comparePassword: jest.fn().mockResolvedValue(false)
        };

        const mockSelect = jest.fn().mockResolvedValue(mockUser);
        User.findOne.mockReturnValue({ select: mockSelect });

        await userController.loginUser(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].statusCode).toBe(401);
        expect(next.mock.calls[0][0].message).toBe("Invalid email or password");

        expect(sendToken).not.toHaveBeenCalled();
    });
});
