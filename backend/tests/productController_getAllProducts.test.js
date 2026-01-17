
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

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

describe('getAllProducts Integration Test', () => {
  it('should return products and counts correctly', async () => {
    // Seed data with 'user' field
    const userId = new mongoose.Types.ObjectId();
    await Product.create([
      { name: 'P1', price: 10, description: 'd1', category: 'c1', images: [], user: userId },
      { name: 'P2', price: 20, description: 'd2', category: 'c2', images: [], user: userId },
      { name: 'P3', price: 30, description: 'd3', category: 'c1', images: [], user: userId },
    ]);

    const req = {
      query: {
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

    expect(responseData.success).toBe(true);
    expect(responseData.productsCount).toBe(3);
    expect(responseData.products.length).toBe(3);
    expect(responseData.filteredProductsCount).toBe(3);
  });

  it('should handle filtering correctly', async () => {
     // Seed data with 'user' field
     const userId = new mongoose.Types.ObjectId();
     await Product.create([
        { name: 'Apple', price: 10, description: 'fruit', category: 'Food', images: [], user: userId },
        { name: 'Banana', price: 20, description: 'fruit', category: 'Food', images: [], user: userId },
        { name: 'Carrot', price: 30, description: 'veg', category: 'Food', images: [], user: userId },
      ]);

      const req = {
        query: {
          keyword: 'Apple'
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

      expect(responseData.success).toBe(true);
      expect(responseData.productsCount).toBe(3); // Total documents in DB
      expect(responseData.products.length).toBe(1); // Only Apple
      expect(responseData.filteredProductsCount).toBe(1);
  });
});
