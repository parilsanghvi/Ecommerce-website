const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = require('../../app');
const User = require('../../models/userModel');

let mongoServer;

// Mock Cloudinary to avoid network requests
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn().mockResolvedValue({
                public_id: 'test_public_id',
                secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            }),
            destroy: jest.fn(),
        },
    },
}));

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
});

describe('Reset Password API', () => {
    it('should reset password successfully with a valid token', async () => {
        const user = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'oldPassword123',
            avatar: { public_id: 'id', url: 'url' }
        });

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const res = await request(app)
            .put(`/api/v1/password/reset/${resetToken}`)
            .send({
                password: 'newPassword123',
                confirmPassword: 'newPassword123'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toBeDefined();

        const updatedUser = await User.findById(user._id).select('+password');
        const isMatch = await updatedUser.comparePassword('newPassword123');
        expect(isMatch).toBe(true);
        expect(updatedUser.resetPasswordToken).toBeUndefined();
        expect(updatedUser.resetPasswordExpire).toBeUndefined();
    });

    it('should fail with an invalid token', async () => {
        const res = await request(app)
            .put(`/api/v1/password/reset/invalidtoken123`)
            .send({
                password: 'newPassword123',
                confirmPassword: 'newPassword123'
            });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/reset password token is invalid or has been expired/i);
    });

    it('should fail with an expired token', async () => {
        const user = await User.create({
            name: 'Test User',
            email: 'expired@example.com',
            password: 'oldPassword123',
            avatar: { public_id: 'id', url: 'url' }
        });

        const resetToken = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordExpire = Date.now() - 1000; // Expired 1 second ago
        await user.save({ validateBeforeSave: false });

        const res = await request(app)
            .put(`/api/v1/password/reset/${resetToken}`)
            .send({
                password: 'newPassword123',
                confirmPassword: 'newPassword123'
            });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/reset password token is invalid or has been expired/i);
    });

    it('should fail if passwords do not match', async () => {
        // The zod schema already catches this and returns 400, but we test the route
        const user = await User.create({
            name: 'Test User',
            email: 'mismatch@example.com',
            password: 'oldPassword123',
            avatar: { public_id: 'id', url: 'url' }
        });

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const res = await request(app)
            .put(`/api/v1/password/reset/${resetToken}`)
            .send({
                password: 'newPassword123',
                confirmPassword: 'differentPassword123'
            });

        expect(res.status).toBe(400); // Because of zod validation
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Passwords do not match/i);
    });
});
