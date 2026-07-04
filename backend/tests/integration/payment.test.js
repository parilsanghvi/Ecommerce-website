const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');

// Mock Cloudinary
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
var mockStripeCreate = jest.fn();
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
        paymentIntents: {
            create: mockStripeCreate,
        },
    }));
});

const app = require('../../app');

let mongoServer;
let userCookie;
let testUser;
let testProduct;

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
    // Clear collections
    await User.deleteMany({});
    await Product.deleteMany({});
    jest.clearAllMocks();

    // Create Product for calculatedItemsPrice
    testProduct = await Product.create({
        name: 'Test Product',
        price: 1000,
        description: 'Test Description',
        category: 'Laptop',
        images: [{ public_id: 'id', url: 'url' }],
        user: new mongoose.Types.ObjectId()
    });

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
                items: [{
                    product: testProduct._id.toString(),
                    quantity: 1
                }]
            };

            const res = await request(app)
                .post('/api/v1/payment/process')
                .set('Cookie', userCookie)
                .send(paymentData);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.client_secret).toBe('test_client_secret_123');

            // 1000 + 18% tax (180) + 200 shipping (not > 1000) = 1380
            expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
                amount: 138000,
                currency: 'inr'
            }));
        });

        it('should handle stripe errors', async () => {
            const stripe = require('stripe');
            const mStripe = stripe('key');
            const createSpy = mStripe.paymentIntents.create;

            createSpy.mockRejectedValue(new Error('Stripe Error'));

            const res = await request(app)
                .post('/api/v1/payment/process')
                .set('Cookie', userCookie)
                .send({
                    items: [{
                        product: testProduct._id.toString(),
                        quantity: 1
                    }]
                });

            expect(res.status).toBe(500);
            expect(res.body.message).toBe('Stripe Error');
        });

        it('should return 400 if items array length exceeds 100', async () => {
            const mockItems = Array.from({ length: 101 }, (_, i) => ({
                product: testProduct._id.toString(),
                quantity: 1
            }));

            const res = await request(app)
                .post('/api/v1/payment/process')
                .set('Cookie', userCookie)
                .send({ items: mockItems });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Too many items in payment request');
        });

        it('should return 401 without authentication', async () => {
            const res = await request(app)
                .post('/api/v1/payment/process')
                .send({ items: [] });

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
    });
});
