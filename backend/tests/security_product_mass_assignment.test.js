const mongoose = require('mongoose');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const request = require('supertest');
const app = require('../app');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

describe('Security: Product Mass Assignment Vulnerability', () => {
    let adminUser, adminToken, product;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Create admin user for auth
        adminUser = await User.create({
            name: 'Admin Test',
            email: 'admin.test@example.com',
            password: 'password123',
            role: 'admin',
            avatar: { public_id: 'test_id', url: 'test_url' }
        });
        adminToken = adminUser.getJWTToken();

        // Create initial product
        product = await Product.create({
            name: 'Original Product',
            price: 100,
            description: 'Original Description',
            category: 'Electronics',
            stock: 10,
            user: adminUser._id,
            ratings: 0,
            numOfReviews: 0,
            reviews: [],
            images: [{ public_id: 'img1', url: 'url1' }]
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should NOT allow updating system-managed fields like user, ratings, or reviews via req.body', async () => {
        const maliciousPayload = {
            name: 'Hacked Product',
            price: 1,
            user: new mongoose.Types.ObjectId().toString(), // Trying to reassign ownership
            ratings: 5,                       // Trying to artificially boost ratings
            numOfReviews: 1000,               // Trying to fake review counts
            reviews: [{                       // Trying to inject fake reviews directly
                user: adminUser._id,
                name: 'Fake User',
                rating: 5,
                comment: 'Fake review!'
            }]
        };

        const response = await request(app)
            .put(`/api/v1/admin/product/${product._id}`)
            .set('Cookie', [`token=${adminToken}`])
            .send(maliciousPayload);

        expect(response.status).toBe(200);

        // Fetch updated product from DB
        const updatedProduct = await Product.findById(product._id);

        // Name and price SHOULD be updated
        expect(updatedProduct.name).toBe('Hacked Product');
        expect(updatedProduct.price).toBe(1);

        // System managed fields should NOT be updated
        expect(updatedProduct.user.toString()).toBe(adminUser._id.toString());
        expect(updatedProduct.ratings).toBe(0);
        expect(updatedProduct.numOfReviews).toBe(0);

    });
});
