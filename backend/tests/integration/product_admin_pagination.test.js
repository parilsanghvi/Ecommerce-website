const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

// Mock cloudinary via require path if module not found
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

describe('getAdminProducts Pagination', () => {
    it('should paginate the results', async () => {
        const userId = new mongoose.Types.ObjectId();

        const products = [];
        for (let i = 0; i < 25; i++) {
            products.push({
                name: `Product ${i}`,
                price: 100,
                description: 'Description',
                category: 'Electronics',
                stock: 50,
                images: [{ public_id: 'pid', url: 'url' }],
                user: userId
            });
        }
        await Product.insertMany(products);

        const req = {
            query: {
                page: '2',
                limit: '10'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await productController.getAdminProducts(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0];

        expect(responseData.success).toBe(true);
        expect(responseData.products).toHaveLength(10);
        expect(responseData.totalCount).toBe(25);
    });
});
