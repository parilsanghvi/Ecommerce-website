jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: {
            send: jest.fn().mockResolvedValue({}),
        },
    })),
}), { virtual: true });

jest.mock('../utils/sendEmail', () => jest.fn());

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn(),
        },
    },
}), { virtual: true });

// Mocks must be defined before use
jest.mock('../models/userModel', () => ({
    findByIdAndUpdate: jest.fn(),
}));

const { updateUserRole } = require('../controllers/userController');
const User = require('../models/userModel');

const mockRequest = () => {
    const req = {};
    req.body = {};
    req.params = {};
    return req;
};

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('User Controller - updateUserRole', () => {
    let req, res, next;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = mockNext;
        jest.clearAllMocks();
    });

    it('should successfully update a user role', async () => {
        req.params.id = 'validUserId123';
        req.body = {
            name: 'Updated Name',
            email: 'updated@example.com',
            role: 'admin'
        };

        const mockUpdatedUser = {
            _id: 'validUserId123',
            name: 'Updated Name',
            email: 'updated@example.com',
            role: 'admin'
        };

        User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

        await updateUserRole(req, res, next);

        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            'validUserId123',
            {
                name: 'Updated Name',
                email: 'updated@example.com',
                role: 'admin'
            },
            {
                new: true,
                runValidators: true,
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if findByIdAndUpdate fails', async () => {
        req.params.id = 'invalidUserId';
        req.body = {
            role: 'admin'
        };

        const mockError = new Error('Database Error');
        User.findByIdAndUpdate.mockRejectedValue(mockError);

        // await the promise returned by the catchAsyncErrors wrapper
        await new Promise(resolve => {
            updateUserRole(req, res, (...args) => {
                next(...args);
                resolve();
            });
        });

        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            'invalidUserId',
            {
                name: undefined,
                email: undefined,
                role: 'admin'
            },
            {
                new: true,
                runValidators: true,
            }
        );

        expect(next).toHaveBeenCalledWith(mockError);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle partial updates correctly', async () => {
        req.params.id = 'validUserId123';
        req.body = {
            role: 'user'
            // name and email missing
        };

        User.findByIdAndUpdate.mockResolvedValue({
             _id: 'validUserId123',
            role: 'user'
        });

        await updateUserRole(req, res, next);

        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            'validUserId123',
            {
                name: undefined,
                email: undefined,
                role: 'user'
            },
            {
                new: true,
                runValidators: true,
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true
        });
    });
});
