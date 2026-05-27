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

// Mock sendEmail utility if it's used directly instead of Resend
jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));


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

describe('Security: Forgot Password Enumeration', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = process.env.FRONTEND_URL;
        process.env.FRONTEND_URL = 'http://localhost:3000';
    });

    afterEach(() => {
        if (originalEnv === undefined) {
            delete process.env.FRONTEND_URL;
        } else {
            process.env.FRONTEND_URL = originalEnv;
        }
    });

    it('should return error when FRONTEND_URL is not configured', async () => {
        delete process.env.FRONTEND_URL;

        await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            avatar: { public_id: 'id', url: 'url' }
        });

        const res = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: 'test@example.com' });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('FRONTEND_URL is not configured on the server.');
    });

    it('should return generic success message for non-existent email', async () => {
        const res = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: 'nonexistent@example.com' });

        // This assertion is expected to FAIL before the fix
        // Currently it returns 404
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('If your email is registered, you will receive a password reset link shortly.');
    });

    it('should return generic success message for existing email', async () => {
        await User.create({
            name: 'Test User',
            email: 'valid@example.com',
            password: 'password123',
            avatar: { public_id: 'id', url: 'url' }
        });

        const res = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: 'valid@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // Ensure message is IDENTICAL to non-existent case
        expect(res.body.message).toBe('If your email is registered, you will receive a password reset link shortly.');
    });
});
