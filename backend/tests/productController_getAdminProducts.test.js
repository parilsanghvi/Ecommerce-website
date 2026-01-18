
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));
jest.mock('cloudinary'); // Mock cloudinary as it's not needed for read tests

const productController = require('../controllers/productController');
const Product = require('../models/productModel');

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

describe('getAdminProducts Integration Test', () => {
  it('should return plain objects compatible with frontend', async () => {
    // Seed data
    const userId = new mongoose.Types.ObjectId();
    const productData = {
        name: 'Admin Product',
        price: 100,
        description: 'desc',
        category: 'cat',
        stock: 50,
        images: [{ public_id: 'pid', url: 'url' }],
        user: userId
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

    // Check fields expected by frontend
    expect(product).toHaveProperty('_id');
    expect(product).toHaveProperty('name', 'Admin Product');
    expect(product).toHaveProperty('price', 100);
    expect(product).toHaveProperty('stock', 50);

    // Verify it is NOT a Mongoose document (no .save method)
    expect(product.save).toBeUndefined();
    expect(product.constructor.name).not.toBe('model');
  });
});
