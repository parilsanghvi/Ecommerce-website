const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Set flag BEFORE importing app so rate limiter uses strict limits
process.env.TEST_RATE_LIMIT = 'true';
const app = require('../app');
const User = require('../models/userModel');

let mongoServer;

// Mock external services
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

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    delete process.env.TEST_RATE_LIMIT;
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
});

describe('Security: Rate Limiting', () => {
    it('should limit login attempts from the same IP', async () => {
        const email = 'rate_limit_user@example.com';
        const password = 'password123';
        const ip = '192.168.1.1';

        await User.create({
            name: 'Rate Limit User',
            email,
            password: 'correctpassword', // hashed by pre-save hook
            avatar: { public_id: 'id', url: 'url' }
        });

        // Make 5 requests (allowed limit)
        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .post('/api/v1/login')
                .set('X-Forwarded-For', ip)
                .send({ email, password: 'wrongpassword' });

            // Should be 401 Unauthorized (invalid credentials), not 429 yet
            if (res.status === 429) {
                console.error(`Request ${i+1} failed with 429: ${res.body.message}`);
            }
            expect(res.status).toBe(401);
        }

        // Make the 6th request (should be blocked)
        const resBlock = await request(app)
            .post('/api/v1/login')
            .set('X-Forwarded-For', ip)
            .send({ email, password: 'wrongpassword' });

        expect(resBlock.status).toBe(429);
        expect(resBlock.body.success).toBe(false);
        expect(resBlock.body.message).toBe("Too many requests, please try again later.");
    });

    it('should allow requests from a different IP', async () => {
        const email = 'other_ip_user@example.com';
        const ip = '192.168.1.2'; // Different IP

        // Even if previous test exhausted limits for 192.168.1.1, this should work
        const res = await request(app)
            .post('/api/v1/login')
            .set('X-Forwarded-For', ip)
            .send({ email, password: 'wrongpassword' });

        expect(res.status).toBe(401); // Not 429
    });

    it('should share rate limit between login and forgot password', async () => {
         const ip = '192.168.1.3';

         // 3 Login attempts
         for (let i = 0; i < 3; i++) {
             await request(app)
                .post('/api/v1/login')
                .set('X-Forwarded-For', ip)
                .send({ email: 'test@test.com', password: 'pwd' });
         }

         // 2 Forgot Password attempts
         for (let i = 0; i < 2; i++) {
             const res = await request(app)
                .post('/api/v1/password/forgot')
                .set('X-Forwarded-For', ip)
                .send({ email: 'test@test.com' });
             expect(res.status).not.toBe(429);
         }

         // 6th attempt (Login) should fail
         const resBlock = await request(app)
            .post('/api/v1/login')
            .set('X-Forwarded-For', ip)
            .send({ email: 'test@test.com', password: 'pwd' });

         expect(resBlock.status).toBe(429);
    });
});
