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

// Mock cloudinary to avoid connection errors if it's used elsewhere during app startup
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

describe('Forgot Password Enumeration Vulnerability', () => {
    it('should return 200 for non-existent email (secure behavior)', async () => {
        const res = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: 'nonexistent@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('If an account with that email exists, we have sent a password reset link.');
    });

    it('should return 200 for existing email (secure behavior)', async () => {
        await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            avatar: { public_id: 'id', url: 'url' }
        });

        const res = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: 'test@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('If an account with that email exists, we have sent a password reset link.');
    });
});
