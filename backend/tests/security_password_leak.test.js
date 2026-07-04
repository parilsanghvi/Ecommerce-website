const { loginUser, registerUser, updatePassword } = require("../controllers/userController");
const bcrypt = require("bcryptjs");
jest.mock("bcryptjs");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");

jest.mock("../utils/jwtToken");
jest.mock("../models/userModel");
jest.mock("../utils/errorhandler");
jest.mock("cloudinary", () => ({
    v2: {
        uploader: {
            destroy: jest.fn(),
            upload: jest.fn().mockResolvedValue({
                public_id: "mock_id",
                secure_url: "mock_url"
            })
        }
    }
}));
jest.mock("../middleware/catchAsyncErrors", () => (func) => (req, res, next) => Promise.resolve(func(req, res, next)).catch(next));

describe("Security: Password Hash Leak", () => {
    let req, res, next;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn(err => console.log('next called with:', err));
        sendToken.mockClear();
        jest.clearAllMocks();
    });

    it("should not pass user with password to sendToken in loginUser", async () => {
        req.body = { email: "test@test.com", password: "password123" };
        const mockUser = {
            _id: "123",
            email: "test@test.com",
            password: "hashedpassword",
            comparePassword: jest.fn().mockResolvedValue(true)
        };
        User.findOne.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockUser)
            })
        });

        bcrypt.compare.mockResolvedValue(true);
        await loginUser(req, res, next);

        expect(sendToken).toHaveBeenCalled();
        const passedUser = sendToken.mock.calls[0][0];
        expect(passedUser.password).toBeUndefined();
    });

    it("should not pass user with password to sendToken in registerUser", async () => {

        req.body = { name: "test", email: "test@test.com", password: "password123", avatar: "base64" };
        const mockUser = {
             _id: "123",
             email: "test@test.com",
             password: "hashedpassword"
        };
        User.create.mockResolvedValue(mockUser);

        await registerUser(req, res, next);

        expect(sendToken).toHaveBeenCalled();
         const passedUser = sendToken.mock.calls[0][0];
        expect(passedUser.password).toBeUndefined();
    });

    it("should not pass user with password to sendToken in updatePassword", async () => {
        req.user = { _id: "123" };
        req.body = { oldPassword: "oldpassword", newPassword: "newpassword", confirmPassword: "newpassword" };
        const mockUser = {
            _id: "123",
            password: "oldhashedpassword",
            comparePassword: jest.fn().mockResolvedValue(true),
            save: jest.fn().mockResolvedValue(true)
        };
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser)
        });

        await updatePassword(req, res, next);

        expect(sendToken).toHaveBeenCalled();
        const passedUser = sendToken.mock.calls[0][0];
        expect(passedUser.password).toBeUndefined();
    });
});
