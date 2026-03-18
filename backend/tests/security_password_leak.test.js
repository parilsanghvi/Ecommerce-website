const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhandler");
const userController = require("../controllers/userController");
const sendToken = require("../utils/jwtToken");

jest.mock("../models/userModel");
jest.mock("../utils/jwtToken");
jest.mock("../middleware/catchAsyncErrors", () => (func) => async (req, res, next) => {
    try {
        await func(req, res, next);
    } catch (error) {
        next(error);
    }
});

describe('Security: Password Leak via sendToken', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {
                email: "test@test.com",
                password: "password123",
                oldPassword: "oldpassword",
                newPassword: "newpassword",
                confirmPassword: "newpassword"
            },
            user: { _id: "userid123" }
        };
        res = {
            cookie: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('loginUser should NOT send password hash in response', async () => {
        const mockUser = {
            _id: "userid123",
            email: "test@test.com",
            password: "hashedpassword",
            comparePassword: jest.fn().mockResolvedValue(true)
        };

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser)
        });

        await userController.loginUser(req, res, next);

        expect(User.findOne).toHaveBeenCalled();
        expect(mockUser.comparePassword).toHaveBeenCalledWith("password123");
        expect(sendToken).toHaveBeenCalledWith(
            expect.objectContaining({ password: undefined }),
            200,
            res
        );

        // Assert that the object passed to sendToken doesn't have the password property
        const sentUser = sendToken.mock.calls[0][0];
        expect(sentUser.password).toBeUndefined();
    });

    it('registerUser should NOT send password hash in response', async () => {
        const mockUser = {
            _id: "userid123",
            email: "test@test.com",
            password: "hashedpassword",
        };

        const cloudinary = require("cloudinary");
        cloudinary.v2 = {
            uploader: {
                upload: jest.fn().mockResolvedValue({
                    public_id: "1",
                    secure_url: "2",
                })
            }
        };

        User.create.mockResolvedValue(mockUser);

        req.body.avatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

        await userController.registerUser(req, res, next);

        expect(User.create).toHaveBeenCalled();
        expect(sendToken).toHaveBeenCalledWith(
            expect.objectContaining({ password: undefined }),
            201,
            res
        );

        // Assert that the object passed to sendToken doesn't have the password property
        const sentUser = sendToken.mock.calls[0][0];
        expect(sentUser.password).toBeUndefined();
    });

    it('updatePassword should NOT send new password hash in response', async () => {
        const mockUser = {
            _id: "userid123",
            password: "hashedpassword",
            comparePassword: jest.fn().mockResolvedValue(true),
            save: jest.fn().mockResolvedValue(true)
        };

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser)
        });

        await userController.updatePassword(req, res, next);

        expect(User.findById).toHaveBeenCalled();
        expect(mockUser.comparePassword).toHaveBeenCalledWith("oldpassword");
        expect(mockUser.save).toHaveBeenCalled();

        expect(sendToken).toHaveBeenCalledWith(
            expect.objectContaining({ password: undefined }),
            200,
            res
        );

        // Assert that the object passed to sendToken doesn't have the password property
        const sentUser = sendToken.mock.calls[0][0];
        expect(sentUser.password).toBeUndefined();
    });
});
