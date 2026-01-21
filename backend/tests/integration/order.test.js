const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');

let mongoServer;
let userCookie;
let testProduct;
let testUser;

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
    // Create User
    testUser = await User.create({
        name: 'Order User',
        email: 'order@example.com',
        password: 'password123',
        avatar: { public_id: 'id', url: 'url' }
    });

    // Login user
    const loginRes = await request(app)
        .post('/api/v1/login')
        .send({ email: 'order@example.com', password: 'password123' });
    userCookie = loginRes.headers['set-cookie'];

    // Create test product with stock
    testProduct = await Product.create({
        name: 'Order Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Laptop',
        stock: 50,
        images: [{ public_id: 'pid', url: 'purl' }],
        user: new mongoose.Types.ObjectId()
    });
});

afterEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    jest.clearAllMocks();
});

describe('Order Integration Tests', () => {

    // ==================== CREATE ORDER ====================
    describe('POST /api/v1/order/new', () => {
        const validOrderData = () => ({
            shippingInfo: {
                address: '123 Test Street',
                city: 'Test City',
                state: 'TS',
                country: 'US',
                pinCode: 12345,
                phoneNo: 1234567890
            },
            orderItems: [{
                name: testProduct.name,
                price: testProduct.price,
                quantity: 2,
                image: 'test_url',
                product: testProduct._id
            }],
            paymentInfo: {
                id: 'pay_test_123',
                status: 'success'
            },
            paidAt: Date.now(),
            itemsPrice: 200,
            taxPrice: 20,
            shippingPrice: 10,
            totalPrice: 230
        });

        it('should create a new order for authenticated user', async () => {
            const res = await request(app)
                .post('/api/v1/order/new')
                .set('Cookie', userCookie)
                .send(validOrderData());

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.order).toBeDefined();
            expect(res.body.order.totalPrice).toBe(230);
        });



        it('should fail without authentication', async () => {
            const res = await request(app)
                .post('/api/v1/order/new')
                .send(validOrderData());

            expect(res.status).toBe(401);
        });
    });

    // ==================== GET MY ORDERS ====================
    describe('GET /api/v1/orders/me', () => {
        beforeEach(async () => {
            await Order.create({
                shippingInfo: {
                    address: '123 Test',
                    city: 'City',
                    state: 'ST',
                    country: 'US',
                    pinCode: 12345,
                    phoneNo: 1234567890
                },
                orderItems: [{
                    name: testProduct.name,
                    price: testProduct.price,
                    quantity: 1,
                    image: 'url',
                    product: testProduct._id
                }],
                user: testUser._id,
                paymentInfo: { id: 'pay_123', status: 'success' },
                paidAt: Date.now(),
                itemsPrice: 100,
                taxPrice: 10,
                shippingPrice: 5,
                totalPrice: 115,
                orderStatus: 'Processing'
            });
        });

        it('should get all orders for authenticated user', async () => {
            const res = await request(app)
                .get('/api/v1/orders/me')
                .set('Cookie', userCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.orders.length).toBe(1);
        });

        it('should fail without authentication', async () => {
            const res = await request(app).get('/api/v1/orders/me');
            expect(res.status).toBe(401);
        });
    });

    // ==================== GET SINGLE ORDER ====================
    describe('GET /api/v1/order/:id', () => {
        let testOrder;

        beforeEach(async () => {
            testOrder = await Order.create({
                shippingInfo: {
                    address: '123 Test',
                    city: 'City',
                    state: 'ST',
                    country: 'US',
                    pinCode: 12345,
                    phoneNo: 1234567890
                },
                orderItems: [{
                    name: testProduct.name,
                    price: testProduct.price,
                    quantity: 1,
                    image: 'url',
                    product: testProduct._id
                }],
                user: testUser._id,
                paymentInfo: { id: 'pay_123', status: 'success' },
                paidAt: Date.now(),
                itemsPrice: 100,
                taxPrice: 10,
                shippingPrice: 5,
                totalPrice: 115,
                orderStatus: 'Processing'
            });
        });

        it('should get single order by ID', async () => {
            const res = await request(app)
                .get(`/api/v1/order/${testOrder._id}`)
                .set('Cookie', userCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.order._id).toBe(testOrder._id.toString());
        });

        it('should return 404 for non-existent order', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/v1/order/${fakeId}`)
                .set('Cookie', userCookie);

            expect(res.status).toBe(404);
        });
    });
});
