const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('../utils/sendEmail', () => jest.fn());
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

describe('Security: Register Rate Limiting', () => {
    // Increase timeout for rate limit tests
    jest.setTimeout(30000);

    beforeAll(async () => {
        // Enable rate limiting for test environment
        process.env.TEST_RATE_LIMIT = 'true';
        process.env.NODE_ENV = 'test';

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

    it('should allow 5 register attempts and block the 6th', async () => {
        const baseUser = {
            name: 'Test User',
            password: 'password123',
            avatar: 'base64imagestring'
        };

        // 5 allowed attempts
        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .post('/api/v1/register')
                .send({ ...baseUser, email: `test${i}@example.com` });

            expect(res.status).toBe(201);
        }

        // 6th attempt - Should be Blocked (429)
        const res = await request(app)
            .post('/api/v1/register')
            .send({ ...baseUser, email: 'test_block@example.com' });

        expect(res.status).toBe(429);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Too many accounts created from this IP, please try again after an hour");
    });
});
