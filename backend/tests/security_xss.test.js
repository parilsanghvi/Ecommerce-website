const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');
const jwt = require('jsonwebtoken');

let mongoServer;
let userCookie;
let testUser;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    testUser = await User.create({
        name: 'XSS User',
        email: 'xss@example.com',
        password: 'password123',
        avatar: { public_id: 'id', url: 'url' }
    });

    const token = testUser.getJWTToken();
    userCookie = `token=${token}`;
});

afterEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    jest.clearAllMocks();
});

describe('Security: XSS in Product Reviews', () => {
    it('should sanitize HTML tags when CREATING a new review', async () => {
        const testProduct = await Product.create({
            name: 'XSS Test Product',
            description: 'Test',
            price: 100,
            category: 'Laptop',
            stock: 10,
            ratings: 0,
            numOfReviews: 0,
            user: testUser._id
        });

        const maliciousComment = '<script>alert("xss")</script> Bad review';

        await request(app)
            .put('/api/v1/review')
            .set('Cookie', userCookie)
            .send({
                rating: 1,
                comment: maliciousComment,
                productId: testProduct._id
            });

        const review = await Review.findOne({ product: testProduct._id });
        expect(review.comment).not.toContain('<script>');
        expect(review.comment).toContain('&lt;script&gt;');
    });

    it('should sanitize HTML tags when UPDATING an existing review', async () => {
        const testProduct = await Product.create({
            name: 'XSS Test Product 2',
            description: 'Test',
            price: 100,
            category: 'Laptop',
            stock: 10,
            ratings: 4,
            numOfReviews: 1,
            user: testUser._id
        });

        await Review.create({
            product: testProduct._id,
            user: testUser._id,
            name: testUser.name,
            rating: 4,
            comment: 'Good'
        });

        const maliciousComment = '<script>alert("xss")</script> Bad review update';

        await request(app)
            .put('/api/v1/review')
            .set('Cookie', userCookie)
            .send({
                rating: 2,
                comment: maliciousComment,
                productId: testProduct._id
            });

        const review = await Review.findOne({ product: testProduct._id });
        expect(review.comment).not.toContain('<script>');
        expect(review.comment).toContain('&lt;script&gt;');
    });
});
