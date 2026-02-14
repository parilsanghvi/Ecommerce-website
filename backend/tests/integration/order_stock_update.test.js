const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');

let mongoServer;
let adminCookie;
let testProduct1;
let testProduct2;
let testOrder;

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

// Increase timeout for slow CI environments
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

beforeEach(async () => {
    // Create Admin User
    await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        avatar: { public_id: 'id', url: 'url' }
    });

    const loginRes = await request(app)
        .post('/api/v1/login')
        .send({ email: 'admin@example.com', password: 'password123' });
    adminCookie = loginRes.headers['set-cookie'];

    // Create products
    testProduct1 = await Product.create({
        name: 'Product 1',
        description: 'Desc 1',
        price: 100,
        stock: 10,
        category: 'Cat',
        user: new mongoose.Types.ObjectId(),
        images: [{ public_id: 'pid', url: 'purl' }]
    });

    testProduct2 = await Product.create({
        name: 'Product 2',
        description: 'Desc 2',
        price: 200,
        stock: 5,
        category: 'Cat',
        user: new mongoose.Types.ObjectId(),
        images: [{ public_id: 'pid', url: 'purl' }]
    });

    // Create Order with both products
    testOrder = await Order.create({
        shippingInfo: {
            address: 'Addr', city: 'City', state: 'State', country: 'Country', pinCode: 12345, phoneNo: 1234567890
        },
        orderItems: [
            {
                name: testProduct1.name,
                price: testProduct1.price,
                quantity: 2,
                image: 'url',
                product: testProduct1._id
            },
            {
                name: testProduct2.name,
                price: testProduct2.price,
                quantity: 3,
                image: 'url',
                product: testProduct2._id
            }
        ],
        user: new mongoose.Types.ObjectId(),
        paymentInfo: { id: 'pid', status: 'success' },
        paidAt: Date.now(),
        itemsPrice: 800,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: 800,
        orderStatus: 'Processing'
    });
});

afterEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    jest.clearAllMocks();
});

describe('Order Stock Update Integration Tests', () => {
    it('should update stock for all products when status is Shipped', async () => {
        const res = await request(app)
            .put(`/api/v1/admin/order/${testOrder._id}`)
            .set('Cookie', adminCookie)
            .send({ status: 'Shipped' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const p1 = await Product.findById(testProduct1._id);
        const p2 = await Product.findById(testProduct2._id);

        expect(p1.stock).toBe(8); // 10 - 2
        expect(p2.stock).toBe(2); // 5 - 3
    });

    it('should fail to update stock if any product has insufficient stock', async () => {
        // Reduce stock of product 2 so it's insufficient (needs 3, set to 2)
        await Product.updateOne({ _id: testProduct2._id }, { stock: 2 });

        const res = await request(app)
            .put(`/api/v1/admin/order/${testOrder._id}`)
            .set('Cookie', adminCookie)
            .send({ status: 'Shipped' });

        expect(res.status).toBe(400); // Bad Request
        expect(res.body.message).toMatch(/Insufficient stock/);
    });
});
