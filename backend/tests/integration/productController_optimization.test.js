const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Product Controller Optimization', () => {
    let adminToken;

    beforeEach(async () => {
        await Product.deleteMany();
        await User.deleteMany();

        // Create a user and get token
        const user = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
            avatar: { public_id: 'id', url: 'url' }
        });
        adminToken = user.getJWTToken();

        // Create a product with reviews
        await Product.create({
            name: 'Test Product',
            description: 'Description',
            price: 100,
            category: 'Electronics',
            stock: 10,
            images: [{ public_id: 'id', url: 'url' }],
            user: user._id,
            reviews: [{
                user: user._id,
                name: 'Reviewer',
                rating: 5,
                comment: 'Great product!'
            }]
        });
    });

    it('getAllProducts should NOT return reviews field', async () => {
        const res = await request(app).get('/api/v1/products');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.products).toHaveLength(1);
        expect(res.body.products[0]).not.toHaveProperty('reviews');
        expect(res.body.products[0]).toHaveProperty('name', 'Test Product');
    });

    it('getAdminProducts should NOT return reviews field', async () => {
        const res = await request(app)
            .get('/api/v1/admin/products')
            .set('Cookie', [`token=${adminToken}`]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.products).toHaveLength(1);
        expect(res.body.products[0]).not.toHaveProperty('reviews');
        expect(res.body.products[0]).toHaveProperty('name', 'Test Product');
    });
});
