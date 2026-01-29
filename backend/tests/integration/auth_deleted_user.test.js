const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');

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

describe('Deleted User Access Security Test', () => {
    it('should deny access to protected route if user is deleted but token is valid', async () => {
        // 1. Register a user
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        };

        await request(app).post('/api/v1/register').send(userData);

        // 2. Login to get token
        const loginRes = await request(app)
            .post('/api/v1/login')
            .send({ email: 'test@example.com', password: 'password123' });

        const token = loginRes.headers['set-cookie'];
        expect(token).toBeDefined();

        // 3. Delete the user from DB manually
        await User.deleteOne({ email: 'test@example.com' });

        // 4. Attempt to access protected route (/api/v1/me)
        const response = await request(app)
            .get('/api/v1/me')
            .set('Cookie', token);

        // 5. Verification
        // Expect failure with 401 once fixed
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("User no longer exists");
    });
});
