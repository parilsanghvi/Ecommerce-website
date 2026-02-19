const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cloudinary = require('cloudinary');
const productController = require('../../controllers/productController');
const Product = require('../../models/productModel');

// Mock catchAsyncErrors
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      upload_stream: jest.fn(),
    },
  },
}));

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
  jest.clearAllMocks();
});

describe('createProduct Integration Test (Multipart)', () => {
  it('should create product with multipart file upload', async () => {
    const userId = new mongoose.Types.ObjectId();
    const req = {
      user: { _id: userId, id: userId },
      body: {
        name: 'Test Product',
        price: 100,
        description: 'Test Description',
        category: 'Test Category',
        Stock: 10,
      },
      files: [
        {
          buffer: Buffer.from('test image 1'),
          mimetype: 'image/jpeg',
        },
        {
          buffer: Buffer.from('test image 2'),
          mimetype: 'image/png',
        },
      ],
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    // Mock upload_stream implementation
    cloudinary.v2.uploader.upload_stream.mockImplementation((options, callback) => {
      // Simulate async upload
      setTimeout(() => {
        callback(null, {
          public_id: 'test_public_id_' + Math.random(),
          secure_url: 'https://res.cloudinary.com/test/image/upload/v123456/test.jpg',
        });
      }, 10);
      return { end: jest.fn() }; // return stream object
    });

    await productController.createProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.success).toBe(true);
    expect(responseData.product.images.length).toBe(2);
    expect(responseData.product.images[0].url).toContain('cloudinary');

    // Verify upload_stream was called
    expect(cloudinary.v2.uploader.upload_stream).toHaveBeenCalledTimes(2);
  });

  it('should fallback to base64 if no files provided', async () => {
     const userId = new mongoose.Types.ObjectId();
     const req = {
       user: { _id: userId, id: userId },
       body: {
         name: 'Test Product Base64',
         price: 100,
         description: 'Test Description',
         category: 'Test Category',
         Stock: 10,
         images: ['data:image/jpeg;base64,teststring'],
       },
       // files is undefined or empty
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
     };

     const next = jest.fn();

     // Mock upload implementation for Base64
     cloudinary.v2.uploader.upload.mockResolvedValue({
         public_id: 'base64_id',
         secure_url: 'https://base64_url'
     });

     await productController.createProduct(req, res, next);

     expect(res.status).toHaveBeenCalledWith(201);
     expect(cloudinary.v2.uploader.upload).toHaveBeenCalledTimes(1);
     const responseData = res.json.mock.calls[0][0];
     expect(responseData.product.images[0].url).toBe('https://base64_url');
  });
});
