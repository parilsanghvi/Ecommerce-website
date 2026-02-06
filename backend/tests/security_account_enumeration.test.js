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
    it('should return generic error message for invalid email', async () => {
        const res = await request(app)
            .post('/api/v1/login')
            .send({ email: 'nonexistent@example.com', password: 'password123' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return generic error message for invalid password', async () => {
         await User.create({
            name: 'Enumeration User',
            email: 'valid@example.com',
            password: 'password123',
            avatar: { public_id: 'id', url: 'url' }
        });

        const res = await request(app)
            .post('/api/v1/login')
            .send({ email: 'valid@example.com', password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password');
    });
});
