const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const productController = require('../controllers/productController');
const Product = require('../models/productModel');

// Mock cloudinary to prevent errors during import/execution
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn()
    }
  }
}));

// Mock catchAsyncErrors to just return the function (so we can await it)
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

describe('Product Controller Pagination & Filtering', () => {
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

  test('getAllProducts returns correct filteredProductsCount with pagination', async () => {
    // Seed 10 products
    const productsToCreate = Array.from({ length: 10 }, (_, i) => ({
        name: `Product ${i}`,
        description: `Description ${i}`,
        price: 100, // All same price
        category: 'Test',
        stock: 10,
        images: [{ public_id: '1', url: 'url' }],
        user: new mongoose.Types.ObjectId()
    }));
    await Product.insertMany(productsToCreate);

    // Create 1 other product that shouldn't match
    await Product.create({
        name: 'Expensive Product',
        description: 'Desc',
        price: 200,
        category: 'Test',
        stock: 5,
        images: [{ public_id: '2', url: 'url' }],
        user: new mongoose.Types.ObjectId()
    });

    const req = {
        query: {
            price: { gte: '50', lte: '150' }, // Should match the 10 products
            page: '1'
        }
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
    const next = jest.fn();

    await productController.getAllProducts(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseData = res.json.mock.calls[0][0];

    // Total products in DB = 11
    expect(responseData.productsCount).toBe(11);

    // Filtered products (price 100) = 10
    expect(responseData.filteredProductsCount).toBe(10);

    // Products on page (resultPerPage is 8 by default in controller)
    expect(responseData.products).toHaveLength(8);

    // Check page 2
    const req2 = {
        query: {
            price: { gte: '50', lte: '150' },
            page: '2'
        }
    };
    await productController.getAllProducts(req2, res, next);
    const responseData2 = res.json.mock.calls[1][0];

    // filteredProductsCount should still be 10
    expect(responseData2.filteredProductsCount).toBe(10);

    // Page 2 should have remaining 2 products
    expect(responseData2.products).toHaveLength(2);
  });
});
