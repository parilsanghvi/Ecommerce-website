const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');

let mongoServer;

// Mock dependencies to avoid side effects
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

jest.mock('resend', () => {
    return {
        Resend: jest.fn().mockImplementation(() => {
            return {
                emails: {
                    send: jest.fn().mockResolvedValue({ id: 'test_id' }),
                },
            };
        }),
    };
});

// Since rateLimiter middleware is initialized when routes are loaded,
// and routes are loaded when app.js is required, the limiter state persists
// across tests in the same file.
// We must enable rate limiting via env var.

beforeAll(async () => {
    process.env.TEST_RATE_LIMIT = 'true';
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    delete process.env.TEST_RATE_LIMIT;
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Security: Rate Limiting', () => {
    // Increase timeout for this test suite as it involves multiple requests
    jest.setTimeout(30000);

    it('should block excessive login attempts from the same IP', async () => {
        const email = 'rate_limit_test@example.com';
        const password = 'password123';

        // Attempt 1-5: Should fail with 401 (Invalid credentials) but NOT be rate limited
        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .post('/api/v1/login')
                .send({ email, password });

            // Expect 401 because user doesn't exist, but NOT 429
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid email or password');
        }

        // Attempt 6: Should be blocked by rate limiter
        const res = await request(app)
            .post('/api/v1/login')
            .send({ email, password });

        expect(res.status).toBe(429);
        expect(res.body.message).toMatch(/Too many login attempts/);
    });

    it('should block excessive password reset attempts', async () => {
        // Note: Forgot password limit is 3
        const email = 'rate_limit_forgot@example.com';

        // Attempt 1-3
        for (let i = 0; i < 3; i++) {
            const res = await request(app)
                .post('/api/v1/password/forgot')
                .send({ email });

            // Expect 200 (generic success message)
            expect(res.status).toBe(200);
        }

        // Attempt 4: Should be blocked
        const res = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email });

        expect(res.status).toBe(429);
        expect(res.body.message).toMatch(/Too many password reset requests/);
    });
});
