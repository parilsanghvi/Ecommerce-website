const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const productController = require('../controllers/productController');
const Product = require('../models/productModel');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Product.deleteMany({});
});

describe('getAllProducts Optimization', () => {
    it('should exclude heavy fields and slice images', async () => {
        const userId = new mongoose.Types.ObjectId();
        await Product.create({
            name: 'Optimized Product',
            description: 'A very long description that should not be returned by the list API to save bandwidth.',
            price: 100,
            category: 'Optimization',
            stock: 10,
            user: userId,
            images: [
                { public_id: '1', url: 'url1' },
                { public_id: '2', url: 'url2' },
                { public_id: '3', url: 'url3' }
            ]
        });

        const req = { query: {} };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await productController.getAllProducts(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0];
        const product = data.products[0];

        // Verify basic fields are present
        expect(product.name).toBe('Optimized Product');
        expect(product.price).toBe(100);

        // Verify heavy/unused fields are excluded
        // Note: These expectations will fail until the optimization is implemented
        expect(product.description).toBeUndefined();
        expect(product.user).toBeUndefined();

        // Ensure important fields are still present (based on review feedback)
        expect(product.category).toBeDefined();
        expect(product.stock).toBeDefined();

        // Verify images are sliced to 1
        expect(product.images).toBeDefined();
        // This will fail (will be 3) until optimization
        expect(product.images).toHaveLength(1);
        expect(product.images[0].url).toBe('url1');
    });
});
