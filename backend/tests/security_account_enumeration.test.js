const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/userModel');

let mongoServer;

// Mock sendEmail to prevent actual emails
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
});

afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
});

describe('Security: Account Enumeration', () => {
    describe('POST /api/v1/password/forgot', () => {
        it('should NOT leak existence of user (Vulnerability Fixed)', async () => {
            const res = await request(app)
                .post('/api/v1/password/forgot')
                .send({ email: 'nonexistent@example.com' });

            // Expecting 200 OK with generic message
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('If a user with that email exists, a password reset link has been sent.');
        });
    });
});
