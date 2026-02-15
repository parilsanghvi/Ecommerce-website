
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

// Mock cloudinary
jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload: jest.fn(),
            upload_stream: jest.fn(),
            destroy: jest.fn()
        }
    }
}));

const productController = require('../../controllers/productController');
const Product = require('../../models/productModel');

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

beforeEach(async () => {
    await Product.deleteMany({});
});

describe('getAdminProducts Field Optimization Integration Test', () => {
    it('should return ONLY name, price, stock, and _id', async () => {
        // Seed data with extra fields
        const userId = new mongoose.Types.ObjectId();
        const productData = {
            name: 'Heavy Product',
            price: 100,
            description: 'This is a very long description that should not be returned in the list view to save bandwidth.',
            category: 'Electronics',
            stock: 50,
            images: [
                { public_id: 'pid1', url: 'url1' },
                { public_id: 'pid2', url: 'url2' },
                { public_id: 'pid3', url: 'url3' }
            ],
            user: userId,
            createdAt: new Date(),
            ratings: 4.5,
            numOfReviews: 10
        };

        await Product.create(productData);

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await productController.getAdminProducts(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0];

        expect(responseData.success).toBe(true);
        expect(responseData.products).toHaveLength(1);

        const product = responseData.products[0];

        // Check required fields
        expect(product).toHaveProperty('_id');
        expect(product).toHaveProperty('name', 'Heavy Product');
        expect(product).toHaveProperty('price', 100);
        expect(product).toHaveProperty('stock', 50);

        // Check excluded fields - THIS SHOULD FAIL INITIALLY
        expect(product).not.toHaveProperty('description');
        expect(product).not.toHaveProperty('images');
        expect(product).not.toHaveProperty('category');
        expect(product).not.toHaveProperty('user');
        expect(product).not.toHaveProperty('ratings');
        expect(product).not.toHaveProperty('numOfReviews');
        expect(product).not.toHaveProperty('createdAt');
    });
});
