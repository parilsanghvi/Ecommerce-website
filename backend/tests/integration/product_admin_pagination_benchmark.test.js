const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

jest.mock('../../utils/imageHandler', () => ({
    processImages: jest.fn(),
    processImagesUpdate: jest.fn()
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

describe('getAdminProducts Benchmark', () => {
    it('should be significantly faster with pagination for large datasets', async () => {
        // Create 2000 products for benchmark
        const userId = new mongoose.Types.ObjectId();
        const products = [];
        for (let i = 0; i < 2000; i++) {
            products.push({
                name: `Product ${i}`,
                price: 100,
                description: 'A very long description to add memory weight ' + 'x'.repeat(100),
                category: 'Electronics',
                stock: 50,
                images: [{ public_id: `pid${i}`, url: `url${i}` }],
                user: userId
            });
        }
        await Product.insertMany(products);

        const req = {
            query: {
                page: '1',
                limit: '20'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        const start = performance.now();
        await productController.getAdminProducts(req, res, next);
        const end = performance.now();

        console.log(`Time taken to fetch admin products: ${end - start} ms`);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0];
        console.log(`Products returned: ${responseData.products.length}`);
    });
});
