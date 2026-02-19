const request = require("supertest");
const app = require("../app");
const cloudinary = require("cloudinary");
const User = require("../models/userModel");

// Mock cloudinary
jest.mock("cloudinary", () => ({
    v2: {
        uploader: {
            upload: jest.fn().mockImplementation((file, options) => {
                return Promise.resolve({
                    public_id: "test_public_id",
                    secure_url: "https://res.cloudinary.com/test/image/upload/v1234567890/avatars/test_public_id.jpg"
                });
            }),
            destroy: jest.fn().mockResolvedValue({ result: "ok" })
        },
        config: jest.fn()
    }
}));

// Helper to create mock user
const getMockUser = () => ({
    _id: "test_user_id",
    name: "Test User",
    email: "test@example.com",
    avatar: { public_id: "old_id", url: "old_url" },
    getJWTToken: jest.fn().mockReturnValue("test_token"),
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
});

// Mock User model
jest.mock("../models/userModel", () => {
    const mockUser = {
        _id: "test_user_id",
        name: "Test User",
        email: "test@example.com",
        avatar: { public_id: "old_id", url: "old_url" },
        getJWTToken: jest.fn().mockReturnValue("test_token"),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
    };
    return {
        create: jest.fn().mockResolvedValue(mockUser),
        findOne: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser),
        }),
        findById: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser),
        }),
        findByIdAndUpdate: jest.fn().mockResolvedValue(mockUser),
    };
});

// Mock Auth Middleware
jest.mock("../middleware/auth", () => {
    const mockUser = {
        _id: "test_user_id",
        name: "Test User",
        email: "test@example.com",
        avatar: { public_id: "old_id", url: "old_url" },
        getJWTToken: jest.fn().mockReturnValue("test_token"),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
    };
    return {
        isAuthenticatedUser: (req, res, next) => {
            req.user = mockUser;
            next();
        },
        authorizedRoles: (...roles) => (req, res, next) => {
            next();
        }
    };
});

describe("Security: Avatar Upload Size Limit", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should REJECT avatar upload exceeding size limit during REGISTRATION", async () => {
        // Create a large string (approx 5MB)
        const largeAvatar = "data:image/jpeg;base64," + "a".repeat(5 * 1024 * 1024);

        const response = await request(app)
            .post("/api/v1/register")
            .send({
                name: "Test User",
                email: "test_large_avatar@example.com",
                password: "password123",
                avatar: largeAvatar
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/Avatar.*large/i);
    });

    test("should REJECT avatar upload exceeding size limit during PROFILE UPDATE", async () => {
        // Create a large string (approx 5MB)
        const largeAvatar = "data:image/jpeg;base64," + "a".repeat(5 * 1024 * 1024);

        const response = await request(app)
            .put("/api/v1/me/update")
            .send({
                name: "Updated Name",
                email: "updated@example.com",
                avatar: largeAvatar
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/Avatar.*large/i);
    });

    test("should ACCEPT avatar upload within size limit", async () => {
        // Create a small string (approx 1KB)
        const smallAvatar = "data:image/jpeg;base64," + "a".repeat(1024);

        const response = await request(app)
            .post("/api/v1/register")
            .send({
                name: "Test User",
                email: "test_small_avatar@example.com",
                password: "password123",
                avatar: smallAvatar
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
    });
});
