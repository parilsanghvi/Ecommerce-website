const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');

let mongoServer;
let adminCookie;
let userCookie;
let testProduct;

jest.setTimeout(30000);

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
    await User.create({
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

    // Login user
    const userLogin = await request(app)
        .post('/api/v1/login')
        .send({ email: 'user@example.com', password: 'password123' });
    userCookie = userLogin.headers['set-cookie'];

    // Create test product
    testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Laptop',
        stock: 10,
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

describe('Admin Integration Tests', () => {

    // ==================== PRODUCT MANAGEMENT ====================
    describe('Product Management', () => {

        describe('GET /api/v1/admin/products', () => {
            it('should get all products as admin', async () => {
                const res = await request(app)
                    .get('/api/v1/admin/products')
                    .set('Cookie', adminCookie);

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.products).toBeDefined();
            });

            it('should fail for non-admin user', async () => {
                const res = await request(app)
                    .get('/api/v1/admin/products')
                    .set('Cookie', userCookie);

                expect(res.status).toBe(403);
            });
        });

        describe('POST /api/v1/admin/product/new', () => {
            it('should create a new product as admin', async () => {
                const productData = {
                    name: 'New Product',
                    description: 'Description',
                    price: 50,
                    category: 'Electronics',
                    Stock: 10,
                    images: ['data:image/png;base64,sample']
                };

                const res = await request(app)
                    .post('/api/v1/admin/product/new')
                    .set('Cookie', adminCookie)
                    .send(productData);

                expect(res.status).toBe(201);
                expect(res.body.success).toBe(true);
                expect(res.body.product.name).toBe('New Product');
            });

            it('should fail for non-admin user', async () => {
                const res = await request(app)
                    .post('/api/v1/admin/product/new')
                    .set('Cookie', userCookie)
                    .send({ name: 'Fail Product' });

                expect(res.status).toBe(403);
            });

            it('should fail without authentication', async () => {
                const res = await request(app)
                    .post('/api/v1/admin/product/new')
                    .send({ name: 'Fail Product' });

                expect(res.status).toBe(401);
            });
        });

        describe('PUT /api/v1/admin/product/:id', () => {
            it('should update a product as admin', async () => {
                const res = await request(app)
                    .put(`/api/v1/admin/product/${testProduct._id}`)
                    .set('Cookie', adminCookie)
                    .send({ name: 'Updated Product Name', price: 150 });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.product.name).toBe('Updated Product Name');
            });

            it('should return 404 for non-existent product', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const res = await request(app)
                    .put(`/api/v1/admin/product/${fakeId}`)
                    .set('Cookie', adminCookie)
                    .send({ name: 'Updated' });

                expect(res.status).toBe(404);
            });
        });

        describe('DELETE /api/v1/admin/product/:id', () => {
            it('should delete a product as admin', async () => {
                const res = await request(app)
                    .delete(`/api/v1/admin/product/${testProduct._id}`)
                    .set('Cookie', adminCookie);

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);

                const check = await Product.findById(testProduct._id);
                expect(check).toBeNull();
            });

            it('should return 404 for non-existent product', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const res = await request(app)
                    .delete(`/api/v1/admin/product/${fakeId}`)
                    .set('Cookie', adminCookie);

                expect(res.status).toBe(404);
            });
        });
    });

    // ==================== USER MANAGEMENT ====================
    describe('User Management', () => {

        describe('GET /api/v1/admin/users', () => {
            it('should get all users as admin', async () => {
                const res = await request(app)
                    .get('/api/v1/admin/users')
                    .set('Cookie', adminCookie);

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.users.length).toBeGreaterThan(0);
            });

            it('should fail for non-admin user', async () => {
                const res = await request(app)
                    .get('/api/v1/admin/users')
                    .set('Cookie', userCookie);

                expect(res.status).toBe(403);
            });
        });

        describe('GET /api/v1/admin/user/:id', () => {
            it('should get single user as admin', async () => {
                const user = await User.findOne({ email: 'user@example.com' });

                const res = await request(app)
                    .get(`/api/v1/admin/user/${user._id}`)
                    .set('Cookie', adminCookie);

                expect(res.status).toBe(200);
                expect(res.body.user.email).toBe('user@example.com');
            });

            it('should return 400 for non-existent user', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const res = await request(app)
                    .get(`/api/v1/admin/user/${fakeId}`)
                    .set('Cookie', adminCookie);

                expect(res.status).toBe(400);
            });
        });

        describe('PUT /api/v1/admin/user/:id', () => {
            it('should update user role as admin', async () => {
                const user = await User.findOne({ email: 'user@example.com' });

                const res = await request(app)
                    .put(`/api/v1/admin/user/${user._id}`)
                    .set('Cookie', adminCookie)
                    .send({ name: 'Updated User', email: 'user@example.com', role: 'admin' });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);

                const updated = await User.findById(user._id);
                expect(updated.role).toBe('admin');
            });
        });

        describe('DELETE /api/v1/admin/user/:id', () => {
            it('should delete user as admin', async () => {
                const user = await User.findOne({ email: 'user@example.com' });

                const res = await request(app)
                    .delete(`/api/v1/admin/user/${user._id}`)
                    .set('Cookie', adminCookie);

                expect(res.status).toBe(200);
                expect(res.body.message).toBe('user deleted successfully');

                const check = await User.findById(user._id);
                expect(check).toBeNull();
            });
        });
    });

    // ==================== ORDER MANAGEMENT ====================
    describe('Order Management', () => {
        let testOrder;

        beforeEach(async () => {
            const user = await User.findOne({ email: 'user@example.com' });
            testOrder = await Order.create({
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
                    quantity: 2,
                    image: 'url',
                    product: testProduct._id
                }],
                user: user._id,
                paymentInfo: { id: 'pay_123', status: 'success' },
                paidAt: Date.now(),
                itemsPrice: 200,
                taxPrice: 20,
                shippingPrice: 10,
                totalPrice: 230,
                orderStatus: 'Processing'
            });
        });

        describe('GET /api/v1/admin/orders', () => {
            it('should get all orders as admin', async () => {
                const res = await request(app)
                    .get('/api/v1/admin/orders')
                    .set('Cookie', adminCookie);

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.orders.length).toBeGreaterThan(0);
            });
        });

        describe('PUT /api/v1/admin/order/:id', () => {
            it('should update order status as admin', async () => {
                const res = await request(app)
                    .put(`/api/v1/admin/order/${testOrder._id}`)
                    .set('Cookie', adminCookie)
                    .send({ status: 'Shipped' });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);

                const updated = await Order.findById(testOrder._id);
                expect(updated.orderStatus).toBe('Shipped');

                const updatedProduct = await Product.findById(testProduct._id);
                expect(updatedProduct.stock).toBe(testProduct.stock - 2);
            });
        });

        describe('DELETE /api/v1/admin/order/:id', () => {
            it('should delete order as admin', async () => {
                const res = await request(app)
                    .delete(`/api/v1/admin/order/${testOrder._id}`)
                    .set('Cookie', adminCookie);

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);

                const check = await Order.findById(testOrder._id);
                expect(check).toBeNull();
            });
        });
    });
});
