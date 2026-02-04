const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/userModel');

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

jest.setTimeout(30000);

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

describe('Forgot Password Security Test', () => {
    it('should return 200 OK generic message even if email does not exist (Account Enumeration Protection)', async () => {
        const nonExistentEmail = 'ghost@example.com';

        const response = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: nonExistentEmail });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("If that email address is in our database, we will send you an email to reset your password.");
    });

    it('should return 200 OK generic message if email exists', async () => {
         const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            avatar: {
                public_id: 'test_id',
                url: 'https://example.com/avatar.jpg'
            }
        };
        await User.create(userData);

        const response = await request(app)
            .post('/api/v1/password/forgot')
            .send({ email: userData.email });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("If that email address is in our database, we will send you an email to reset your password.");
    });
});
