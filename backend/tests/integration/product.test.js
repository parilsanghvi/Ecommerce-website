const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../app');
const Product = require('../../models/productModel');

let mongoServer;

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

afterEach(async () => {
    await Product.deleteMany({});
    jest.clearAllMocks();
});

describe('Product Integration Tests (Public)', () => {

    beforeEach(async () => {
        // Seed multiple products for testing
        await Product.create([
            {
                name: 'Laptop Pro',
                description: 'High-end laptop',
                price: 1500,
                category: 'Laptop',
                stock: 5,
                ratings: 4.5,
                images: [{ public_id: 'id1', url: 'url1' }],
                user: new mongoose.Types.ObjectId()
            },
            {
                name: 'Running Shoes',
                description: 'Comfortable shoes',
                price: 100,
                category: 'Footwear',
                stock: 20,
                ratings: 4.0,
                images: [{ public_id: 'id2', url: 'url2' }],
                user: new mongoose.Types.ObjectId()
            },
            {
                name: 'Camera DSLR',
                description: 'Professional camera',
                price: 800,
                category: 'Camera',
                stock: 10,
                ratings: 4.8,
                images: [{ public_id: 'id3', url: 'url3' }],
                user: new mongoose.Types.ObjectId()
            },
            {
                name: 'Budget Laptop',
                description: 'Entry-level laptop',
                price: 500,
                category: 'Laptop',
                stock: 0,
                ratings: 3.5,
                images: [{ public_id: 'id4', url: 'url4' }],
                user: new mongoose.Types.ObjectId()
            }
        ]);
    });

    // ==================== GET ALL PRODUCTS ====================
    describe('GET /api/v1/products', () => {
        it('should retrieve all products', async () => {
            const res = await request(app).get('/api/v1/products');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.products.length).toBeGreaterThan(0);
            expect(res.body.productsCount).toBe(4);
        });

        it('should return pagination info', async () => {
            const res = await request(app).get('/api/v1/products');

            expect(res.body.resultPerPage).toBeDefined();
            expect(res.body.filteredProductsCount).toBeDefined();
        });
    });

    // ==================== SEARCH PRODUCTS ====================
    describe('GET /api/v1/products?keyword=', () => {
        it('should search products by keyword', async () => {
            const res = await request(app).get('/api/v1/products?keyword=Laptop');

            expect(res.status).toBe(200);
            expect(res.body.products.length).toBe(2);
            expect(res.body.products.every(p => p.name.toLowerCase().includes('laptop'))).toBe(true);
        });

        it('should return empty array for no matches', async () => {
            const res = await request(app).get('/api/v1/products?keyword=NonExistent');

            expect(res.status).toBe(200);
            expect(res.body.products.length).toBe(0);
        });
    });

    // ==================== FILTER BY CATEGORY ====================
    describe('GET /api/v1/products?category=', () => {
        it('should filter products by category', async () => {
            const res = await request(app).get('/api/v1/products?category=Footwear');

            expect(res.status).toBe(200);
            expect(res.body.products.length).toBe(1);
            expect(res.body.products[0].category).toBe('Footwear');
        });
    });

    // ==================== FILTER BY PRICE ====================
    describe('GET /api/v1/products?price[gte]=&price[lte]=', () => {
        it('should filter products by price range', async () => {
            const res = await request(app).get('/api/v1/products?price[gte]=100&price[lte]=600');

            expect(res.status).toBe(200);
            expect(res.body.products.every(p => p.price >= 100 && p.price <= 600)).toBe(true);
        });
    });

    // ==================== FILTER BY RATINGS ====================
    describe('GET /api/v1/products?ratings[gte]=', () => {
        it('should filter products by minimum rating', async () => {
            const res = await request(app).get('/api/v1/products?ratings[gte]=4.5');

            expect(res.status).toBe(200);
            expect(res.body.products.every(p => p.ratings >= 4.5)).toBe(true);
        });
    });

    // ==================== GET SINGLE PRODUCT ====================
    describe('GET /api/v1/product/:id', () => {
        it('should retrieve a single product by ID', async () => {
            const product = await Product.findOne({ name: 'Laptop Pro' });

            const res = await request(app).get(`/api/v1/product/${product._id}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.product.name).toBe('Laptop Pro');
            expect(res.body.product._id).toBe(product._id.toString());
        });

        it('should return 404 for non-existent product', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/v1/product/${fakeId}`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('product not found');
        });

        it('should return error for invalid product ID format', async () => {
            const res = await request(app).get('/api/v1/product/invalidid');

            expect(res.status).toBe(400); // Cast error handling in middleware returns 400
        });
    });

    // ==================== PAGINATION ====================
    describe('GET /api/v1/products?page=', () => {
        it('should handle pagination correctly', async () => {
            const res = await request(app).get('/api/v1/products?page=1');

            expect(res.status).toBe(200);
            expect(res.body.products.length).toBeLessThanOrEqual(res.body.resultPerPage);
        });
    });

    // ==================== COMBINED FILTERS ====================
    describe('GET /api/v1/products with combined filters', () => {
        it('should apply multiple filters simultaneously', async () => {
            const res = await request(app)
                .get('/api/v1/products?category=Laptop&price[gte]=1000&ratings[gte]=4');

            expect(res.status).toBe(200);
            expect(res.body.products.every(p =>
                p.category === 'Laptop' && p.price >= 1000 && p.ratings >= 4
            )).toBe(true);
        });
    });
});
