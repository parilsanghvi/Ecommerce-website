const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/userModel');

// Enable rate limiting for this test suite
process.env.TEST_RATE_LIMIT = 'true';

let mongoServer;

// Mock Cloudinary
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

// Mock Resend
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
    await mongoose.disconnect();
    await mongoServer.stop();
    // Reset env var
    delete process.env.TEST_RATE_LIMIT;
});

afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
});

describe('Security: Rate Limiting on Registration', () => {
    it('should block excessive registration attempts from the same IP', async () => {
        const userData = {
            name: 'Rate Limit User',
            password: 'password123',
            avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        };

        // Attempt 5 registrations (assuming limit will be 5)
        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .post('/api/v1/register')
                .send({ ...userData, email: `ratelimit${i}@example.com` });

            // Should succeed (201)
            expect(res.status).toBe(201);
        }

        // The 6th attempt should be blocked
        const res = await request(app)
            .post('/api/v1/register')
            .send({ ...userData, email: 'blocked@example.com' });

        // This assertion will fail until the fix is applied
        expect(res.status).toBe(429);
        expect(res.body.message).toMatch(/Too many registration attempts/i);
    }, 30000); // 30s timeout
});
