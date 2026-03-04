const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Product = require('../models/productModel');
const User = require('../models/userModel');
require('./setupEnv'); // Load env vars

let mongoServer;

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn().mockResolvedValue({
        public_id: 'test_id',
        secure_url: 'test_url'
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
  }
}));

describe('Mass Assignment Vulnerability', () => {
  let adminToken;
  let adminUser;

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
    await User.deleteMany({});
    jest.clearAllMocks();

    adminUser = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      avatar: { public_id: 'avatar_id', url: 'avatar_url' }
    });

    adminToken = adminUser.getJWTToken();
  });

  it('should prevent mass assignment of restricted fields on product creation', async () => {
    const maliciousPayload = {
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      category: 'Test Category',
      stock: 10,
      // Maliciously injected fields that shouldn't be set by user
      ratings: 5,
      numOfReviews: 100,
      reviews: [{
        user: adminUser._id,
        name: 'Fake Reviewer',
        rating: 5,
        comment: 'Fake Review'
      }]
    };

    const response = await request(app)
      .post('/api/v1/admin/product/new')
      .set('Cookie', `token=${adminToken}`)
      .send(maliciousPayload);

    expect(response.status).toBe(201);

    const product = await Product.findById(response.body.product._id);

    // The restricted fields should remain at their defaults, not the injected values
    expect(product.ratings).toBe(0);
    expect(product.numOfReviews).toBe(0);

  });

  it('should prevent array payload bypass on product creation', async () => {
    const maliciousPayload = [{
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      category: 'Test Category',
      stock: 10,
      ratings: 5,
      numOfReviews: 100,
      reviews: [{
        user: adminUser._id,
        name: 'Fake Reviewer',
        rating: 5,
        comment: 'Fake Review'
      }]
    }];

    const response = await request(app)
      .post('/api/v1/admin/product/new')
      .set('Cookie', `token=${adminToken}`)
      .send(maliciousPayload);

    // Mongoose create takes an array but destructuring handles objects.
    // Usually APIs should throw or handle array specifically, but ensuring no arrays bypass our check is important.
    // If it throws an error or fails validation, that's fine. If it creates it, we check it.

    if (response.status === 201) {
        let createdProduct = Array.isArray(response.body.product) ? response.body.product[0] : response.body.product;
        const product = await Product.findById(createdProduct._id);

        expect(product.ratings).toBe(0);
        expect(product.numOfReviews).toBe(0);

    }
  });

  it('should prevent mass assignment of restricted fields on product update', async () => {
    const product = await Product.create({
      name: 'Original Product',
      description: 'Original Description',
      price: 50,
      category: 'Original Category',
      stock: 5,
      user: adminUser._id,
      images: []
    });

    const maliciousUpdatePayload = {
      name: 'Updated Product',
      // Maliciously injected fields
      ratings: 5,
      numOfReviews: 100,
      reviews: [{
        user: adminUser._id,
        name: 'Fake Reviewer',
        rating: 5,
        comment: 'Fake Review'
      }]
    };

    const response = await request(app)
      .put(`/api/v1/admin/product/${product._id}`)
      .set('Cookie', `token=${adminToken}`)
      .send(maliciousUpdatePayload);

    expect(response.status).toBe(200);

    const updatedProduct = await Product.findById(product._id);

    expect(updatedProduct.name).toBe('Updated Product');
    // Security check: ratings and reviews should NOT be updatable via mass assignment
    expect(updatedProduct.ratings).toBe(0);
    expect(updatedProduct.numOfReviews).toBe(0);

  });

  it('should prevent NoSQL operator bypass on product update', async () => {
    const product = await Product.create({
      name: 'Original Product',
      description: 'Original Description',
      price: 50,
      category: 'Original Category',
      stock: 5,
      user: adminUser._id,
      images: []
    });

    const maliciousUpdatePayload = {
      name: 'Updated Product',
      $set: {
        ratings: 5,
        numOfReviews: 100
      }
    };

    const response = await request(app)
      .put(`/api/v1/admin/product/${product._id}`)
      .set('Cookie', `token=${adminToken}`)
      .send(maliciousUpdatePayload);

    expect(response.status).toBe(200);

    const updatedProduct = await Product.findById(product._id);

    // Security check: ratings and reviews should NOT be updatable via $set mass assignment bypass
    expect(updatedProduct.ratings).toBe(0);
    expect(updatedProduct.numOfReviews).toBe(0);
  });
});
