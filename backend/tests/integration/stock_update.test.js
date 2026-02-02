const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');

let mongoServer;
let adminCookie;
let testProduct;

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
    // Create Admin User
    await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        avatar: { public_id: 'id', url: 'url' }
    });

    // Create Regular User
    const user = await User.create({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'password123',
        role: 'user',
        avatar: { public_id: 'id', url: 'url' }
    });

    // Login admin
    const adminLogin = await request(app)
        .post('/api/v1/login')
        .send({ email: 'admin@example.com', password: 'password123' });
    adminCookie = adminLogin.headers['set-cookie'];

    // Create test product
    testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Laptop',
        stock: 100,
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

describe('Stock Update Integration Test', () => {

    describe('PUT /api/v1/admin/order/:id', () => {
        it('should decrease product stock when order is shipped', async () => {
            const user = await User.findOne({ email: 'user@example.com' });

            // Create an order with 5 items
            const testOrder = await Order.create({
                shippingInfo: {
                    address: '123 Test St',
                    city: 'Test City',
                    state: 'TS',
                    country: 'US',
                    pinCode: '12345',
                    phoneNo: '1234567890'
                },
                orderItems: [{
                    name: testProduct.name,
                    price: testProduct.price,
                    quantity: 5,
                    image: 'url',
                    product: testProduct._id
                }],
                user: user._id,
                paymentInfo: { id: 'pay_123', status: 'success' },
                paidAt: Date.now(),
                itemsPrice: 500,
                taxPrice: 50,
                shippingPrice: 10,
                totalPrice: 560,
                orderStatus: 'Processing'
            });

            // Initial stock check
            const initialProduct = await Product.findById(testProduct._id);
            expect(initialProduct.stock).toBe(100);

            // Update order status to Shipped
            const res = await request(app)
                .put(`/api/v1/admin/order/${testOrder._id}`)
                .set('Cookie', adminCookie)
                .send({ status: 'Shipped' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify stock decreased
            const updatedProduct = await Product.findById(testProduct._id);
            expect(updatedProduct.stock).toBe(95); // 100 - 5
        });
    });
});
