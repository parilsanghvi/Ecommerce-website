const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');

// Mock Cloudinary (needed for User creation if avatar is involved, though model defaults might apply)
// But validation requires avatar public_id and url
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn().mockResolvedValue({
                public_id: 'test_id',
                secure_url: 'test_url',
            }),
            destroy: jest.fn(),
        },
    },
}));

// Mock Stripe
// We need the mock to return a singleton object so we can spy on the same instance
jest.mock('stripe', () => {
    const mStripe = {
        paymentIntents: {
            create: jest.fn().mockResolvedValue({ client_secret: 'default_secret' }),
        },
    };
    return jest.fn(() => mStripe);
});

let mongoServer;
let userCookie;
let testUser;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Clear mocks
    const stripe = require('stripe');
    const mStripe = stripe('key');
    mStripe.paymentIntents.create.mockClear();

    // Create User
    testUser = await User.create({
        name: 'Payment User',
        email: 'payment@example.com',
        password: 'password123',
        avatar: { public_id: 'id', url: 'url' }
    });

    // Login user to get cookie
    const loginRes = await request(app)
        .post('/api/v1/login')
        .send({ email: 'payment@example.com', password: 'password123' });

    userCookie = loginRes.headers['set-cookie'];
});

afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
});

describe('Payment Integration Tests', () => {

    // ==================== PROCESS PAYMENT ====================
    describe('POST /api/v1/payment/process', () => {
        it('should process payment and return client_secret', async () => {
            const stripe = require('stripe');
            const mStripe = stripe('key');
            const createSpy = mStripe.paymentIntents.create;

            createSpy.mockResolvedValue({
                client_secret: 'test_client_secret_123'
            });

            const paymentData = {
                amount: 1000
            };

            const res = await request(app)
                .post('/api/v1/payment/process')
                .set('Cookie', userCookie)
                .send(paymentData);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.client_secret).toBe('test_client_secret_123');

            expect(createSpy).toHaveBeenCalledTimes(1);
            expect(createSpy).toHaveBeenCalledWith({
                amount: 1000,
                currency: 'inr',
                metadata: {
                    company: 'Ecommerce',
                },
            });
        });

        it('should handle stripe errors', async () => {
            const stripe = require('stripe');
            const mStripe = stripe('key');
            const createSpy = mStripe.paymentIntents.create;

            createSpy.mockRejectedValue(new Error('Stripe Error'));

            const res = await request(app)
                .post('/api/v1/payment/process')
                .set('Cookie', userCookie)
                .send({ amount: 1000 });

            // catchAsyncErrors should catch this and error middleware should return 500
            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Stripe Error');
        });

        it('should return 401 without authentication', async () => {
            const res = await request(app)
                .post('/api/v1/payment/process')
                .send({ amount: 1000 });

            expect(res.status).toBe(401);
        });
    });

    // ==================== GET STRIPE API KEY ====================
    describe('GET /api/v1/stripeapikey', () => {
        it('should return stripe api key', async () => {
            const res = await request(app)
                .get('/api/v1/stripeapikey')
                .set('Cookie', userCookie);

            expect(res.status).toBe(200);
            expect(res.body.stripeApiKey).toBe(process.env.STRIPE_API_KEY);
        });

        it('should return 401 without authentication', async () => {
            const res = await request(app)
                .get('/api/v1/stripeapikey');

            expect(res.status).toBe(401);
        });
    });
});
