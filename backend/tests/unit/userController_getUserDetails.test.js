// Mock dependencies before requiring the controller
jest.mock('mongoose', () => ({
    connect: jest.fn(),
    Schema: jest.fn(),
    model: jest.fn()
}), { virtual: true });

jest.mock('../../models/userModel', () => ({
    findById: jest.fn(),
    findOne: jest.fn(),
}), { virtual: true });

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn(),
        }
    }
}), { virtual: true });

jest.mock('../../utils/jwtToken', () => jest.fn(), { virtual: true });
jest.mock('../../utils/sendEmail', () => jest.fn(), { virtual: true });

const userController = require('../../controllers/userController');

// Mock catchAsyncErrors to pass the request straight through
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

describe('getUserDetails Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'user',
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should return user details with a 200 status code', async () => {
        await userController.getUserDetails(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            user: req.user
        });

        // Assert that the user in the response matches the req.user
        const responseData = res.json.mock.calls[0][0];
        expect(responseData.user).toEqual({
            _id: 'user123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
        });
    });

    it('should handle an undefined user correctly (edge case)', async () => {
        // Even though middleware should ensure req.user exists,
        // it is good to test the controller's behavior if it's somehow missing.
        req.user = undefined;

        await userController.getUserDetails(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            user: undefined
        });
    });
});
