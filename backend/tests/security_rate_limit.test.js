const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('../utlis/sendEmail', () => jest.fn());
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn().mockResolvedValue({ public_id: 'test_id', secure_url: 'test_url' }),
            destroy: jest.fn(),
        },
    },
}));

let app;
let mongoServer;

describe('Security: Rate Limiting Middleware', () => {
    jest.setTimeout(30000);

    beforeAll(async () => {
        // Enable rate limiting for test environment
        process.env.TEST_RATE_LIMIT = 'true';

        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        process.env.DB_URI = uri;

        // Connect to mongoose
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri);
        }

        // Import app AFTER setting env vars
        app = require('../app');
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        delete process.env.TEST_RATE_LIMIT;
    });

    it('should allow 10 login attempts and block the 11th', async () => {
        const loginData = { email: 'test@example.com', password: 'password123' };

        // 10 allowed attempts
        for (let i = 0; i < 10; i++) {
            const res = await request(app).post('/api/v1/login').send(loginData);
            // Expect 401 (Invalid creds) or 200 (if user existed), but NOT 429
            expect(res.status).not.toBe(429);
        }

        // 11th attempt - Blocked
        const res = await request(app).post('/api/v1/login').send(loginData);
        expect(res.status).toBe(429);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Too many login attempts, please try again later");
    });

    it('should allow 5 forgot password attempts and block the 6th (Independent of Login)', async () => {
        // Note: Even if login is blocked, forgot password should start fresh (different limiter instance)
        const emailData = { email: 'test@example.com' };

        // 5 allowed attempts
        for (let i = 0; i < 5; i++) {
            const res = await request(app).post('/api/v1/password/forgot').send(emailData);
            expect(res.status).not.toBe(429);
        }

        // 6th attempt - Blocked
        const res = await request(app).post('/api/v1/password/forgot').send(emailData);
        expect(res.status).toBe(429);
        // The forgotPassword controller might return different structure or message
        // Based on userController.js: res.status(200).json({ success: true, message: ... })
        // But rate limiter returns { success: false, message: ... }
        expect(res.body.message).toBe("Too many password reset attempts, please try again later");
    });
});
