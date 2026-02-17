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

    it('should block requests after rate limit exceeded', async () => {
        // We will make 10 requests. Rate limiting is 5/15min.
        // So the first 5 should be accepted (or fail validation, but not 429)
        // The 6th should be 429.

        let rateLimited = false;
        for (let i = 0; i < 10; i++) {
            const res = await request(app)
                .post('/api/v1/register')
                .field('name', `Test User ${i}`)
                .field('email', `test${i}@example.com`)
                .field('password', 'password123');

            if (res.status === 429) {
                rateLimited = true;
                // Verify the message
                expect(res.body.message).toBe("Too many registration attempts, please try again later");
                break;
            }
        }

        // Assert that we WERE rate limited
        expect(rateLimited).toBe(true);
    });
});
