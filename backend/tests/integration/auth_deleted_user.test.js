const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');

let mongoServer;

jest.setTimeout(30000);

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

describe('Deleted User Authentication', () => {
    it('should deny access if user is deleted but token is valid', async () => {
        // 1. Create User
        const user = await User.create({
            name: 'Delete Me',
            email: 'delete@example.com',
            password: 'password123',
            avatar: { public_id: 'id', url: 'url' }
        });

        // 2. Login to get token
        const loginRes = await request(app)
            .post('/api/v1/login')
            .send({ email: 'delete@example.com', password: 'password123' });

        const tokenCookie = loginRes.headers['set-cookie'];
        expect(loginRes.status).toBe(200);

        // 3. Delete User from DB
        await User.deleteOne({ _id: user._id });

        // 4. Access protected route
        const res = await request(app)
            .get('/api/v1/me')
            .set('Cookie', tokenCookie);

        // 5. Expect 401
        // Without the fix, this might return 200 or 500
        expect(res.status).toBe(401);
    });
});
