const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');

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

describe('Deleted User Authentication', () => {
    it('should return 401 when accessing protected route with token of deleted user', async () => {
        // 1. Create User
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            avatar: { public_id: 'test_id', url: 'test_url' }
        };
        const user = await User.create(userData);

        // 2. Login
        const loginRes = await request(app)
            .post('/api/v1/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(loginRes.status).toBe(200);
        const cookie = loginRes.headers['set-cookie'];
        expect(cookie).toBeDefined();

        // 3. Delete User
        await User.deleteOne({ _id: user._id });

        // 4. Access Protected Route (/api/v1/me)
        const meRes = await request(app)
            .get('/api/v1/me')
            .set('Cookie', cookie);

        // 5. Expect 401 (Currently fails/crashes/500s)
        // Note: Without the fix, this might return 500 or crash.
        // We assert 401 because that's what we WANT.
        expect(meRes.status).toBe(401);
        // The message check is optional but good practice
        // expect(meRes.body.message).toMatch(/user not found|login/i);
    });
});
