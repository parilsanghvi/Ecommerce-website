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

jest.mock('../utlis/sendEmail', () => jest.fn());

const sendEmail = require('../utlis/sendEmail');

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
    it('should return generic success message for valid email', async () => {
        await User.create({
            name: 'Valid User',
            email: 'valid@example.com',
            password: 'password123',
            avatar: { public_id: 'id', url: 'url' }
        });

        const res = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: 'valid@example.com' });

        expect(res.status).toBe(200);
        // This checks if the message is generic
        expect(res.body.message).toBe('If an account with that email exists, we have sent a password reset link.');
        expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should return SAME generic success message for invalid email', async () => {
        const res = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: 'nonexistent@example.com' });

        // Currently this fails (returns 404)
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('If an account with that email exists, we have sent a password reset link.');
        expect(sendEmail).not.toHaveBeenCalled();
    });
});
