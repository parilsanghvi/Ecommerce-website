const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/userModel');

let mongoServer;

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

jest.mock('../utlis/sendEmail', () => jest.fn().mockResolvedValue(true));

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

describe('Security: Input Validation', () => {
    describe('Forgot Password', () => {
        it('should return 400 for invalid email format', async () => {
            const res = await request(app)
                .post('/api/v1/password/forgot')
                .send({ email: 'invalid-email' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Please enter a valid email');
        });

        it('should return 400 for missing email', async () => {
            const res = await request(app)
                .post('/api/v1/password/forgot')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Please enter email');
        });
    });

    describe('Reset Password', () => {
        it('should return 400 for short password', async () => {
            const res = await request(app)
                .put('/api/v1/password/reset/some-token')
                .send({
                    password: 'short',
                    confirmPassword: 'short'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password must be at least 8 characters');
        });

        it('should return 400 for mismatched passwords', async () => {
            const res = await request(app)
                .put('/api/v1/password/reset/some-token')
                .send({
                    password: 'password123',
                    confirmPassword: 'password456'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Passwords do not match');
        });

         it('should return 400 for missing confirmPassword', async () => {
            const res = await request(app)
                .put('/api/v1/password/reset/some-token')
                .send({
                    password: 'password123'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Please confirm password');
        });
    });
});
