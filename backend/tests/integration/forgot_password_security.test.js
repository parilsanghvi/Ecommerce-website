const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');

let mongoServer;

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
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
});

describe('Forgot Password Security', () => {
    it('should return 200 even if user does not exist (Security Fix)', async () => {
        const res = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: 'nonexistent@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('If your email is registered, you will receive a password reset link shortly.');
    });

    it('should return 200 if user exists', async () => {
        await User.create({
            name: 'Test User',
            email: 'existing@example.com',
            password: 'password123',
            avatar: { public_id: 'id', url: 'url' }
        });

        const res = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: 'existing@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('If your email is registered, you will receive a password reset link shortly.');
    });
});
