const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');

let mongoServer;
let userCookie;
let adminCookie;
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
        name: 'Review User',
        email: 'review@example.com',
        password: 'password123',
        avatar: { public_id: 'id', url: 'url' }
    });

    // Create Admin
    await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        avatar: { public_id: 'id', url: 'url' }
    });

    // Login user
    const loginRes = await request(app)
        .post('/api/v1/login')
        .send({ email: 'review@example.com', password: 'password123' });
    userCookie = loginRes.headers['set-cookie'];

    // Login admin
    const adminLogin = await request(app)
        .post('/api/v1/login')
        .send({ email: 'admin@example.com', password: 'password123' });
    adminCookie = adminLogin.headers['set-cookie'];

    // Create test product
    testProduct = await Product.create({
        name: 'Review Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Laptop',
        stock: 10,
        ratings: 0,
        numOfReviews: 0,
        reviews: [],
        images: [{ public_id: 'pid', url: 'purl' }],
        user: new mongoose.Types.ObjectId()
    });
});

afterEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    jest.clearAllMocks();
});

describe('Review Integration Tests', () => {

    // ==================== CREATE/UPDATE REVIEW ====================
    describe('PUT /api/v1/review', () => {
        it('should create a new review for a product', async () => {
            const res = await request(app)
                .put('/api/v1/review')
                .set('Cookie', userCookie)
                .send({
                    rating: 5,
                    comment: 'Excellent product!',
                    productId: testProduct._id
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const updated = await Product.findById(testProduct._id);
            expect(updated.numOfReviews).toBe(1);
            expect(updated.ratings).toBe(5);
            expect(updated.reviews[0].comment).toBe('Excellent product!');
        });

        it('should update existing review by same user', async () => {
            // First review
            await request(app)
                .put('/api/v1/review')
                .set('Cookie', userCookie)
                .send({
                    rating: 3,
                    comment: 'Average product',
                    productId: testProduct._id
                });

            // Update review
            const res = await request(app)
                .put('/api/v1/review')
                .set('Cookie', userCookie)
                .send({
                    rating: 5,
                    comment: 'Actually, it is excellent!',
                    productId: testProduct._id
                });

            expect(res.status).toBe(200);

            const updated = await Product.findById(testProduct._id);
            expect(updated.numOfReviews).toBe(1); // Still 1 review
            expect(updated.ratings).toBe(5);
            expect(updated.reviews[0].comment).toBe('Actually, it is excellent!');
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .put('/api/v1/review')
                .send({
                    rating: 5,
                    comment: 'Great!',
                    productId: testProduct._id
                });

            expect(res.status).toBe(401);
        });
    });

    // ==================== GET PRODUCT REVIEWS ====================
    describe('GET /api/v1/reviews', () => {
        beforeEach(async () => {
            // Add a review
            testProduct.reviews.push({
                user: testUser._id,
                name: testUser.name,
                rating: 4,
                comment: 'Good product'
            });
            testProduct.numOfReviews = 1;
            testProduct.ratings = 4;
            await testProduct.save();
        });

        it('should get all reviews for a product', async () => {
            const res = await request(app)
                .get(`/api/v1/reviews?id=${testProduct._id}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.reviews.length).toBe(1);
            expect(res.body.reviews[0].comment).toBe('Good product');
        });

        it('should return 404 for non-existent product', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/v1/reviews?id=${fakeId}`);

            expect(res.status).toBe(404);
        });
    });

    // ==================== DELETE REVIEW ====================
    describe('DELETE /api/v1/reviews', () => {
        let reviewId;

        beforeEach(async () => {
            // Add a review
            testProduct.reviews.push({
                user: testUser._id,
                name: testUser.name,
                rating: 3,
                comment: 'Okay product'
            });
            testProduct.numOfReviews = 1;
            testProduct.ratings = 3;
            await testProduct.save();

            const updated = await Product.findById(testProduct._id);
            reviewId = updated.reviews[0]._id;
        });

        it('should delete a review', async () => {
            const res = await request(app)
                .delete(`/api/v1/reviews?id=${reviewId}&productId=${testProduct._id}`)
                .set('Cookie', userCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const updated = await Product.findById(testProduct._id);
            expect(updated.reviews.length).toBe(0);
            expect(updated.numOfReviews).toBe(0);
        });

        it('should return 404 for non-existent product', async () => {
            const fakeProductId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/v1/reviews?id=${reviewId}&productId=${fakeProductId}`)
                .set('Cookie', userCookie);

            expect(res.status).toBe(404);
        });
    });
});
