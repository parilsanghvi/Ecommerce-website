const mongoose = require('mongoose');
const ErrorHandler = require('../utils/errorhandler');
const productController = require('../controllers/productController');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

// Mock Models
jest.mock('../models/productModel');
jest.mock('../models/reviewModel');

describe('deleteReview Authorization Security Test', () => {
  const mockProductId = new mongoose.Types.ObjectId().toString();
  const mockReviewId = new mongoose.Types.ObjectId().toString();
  const ownerId = new mongoose.Types.ObjectId().toString();
  const attackerId = new mongoose.Types.ObjectId().toString();

  it('should prevent unauthorized users from deleting reviews they do not own', async () => {
    // 1. Setup Data
    const mockReview = {
      _id: mockReviewId,
      user: ownerId,
      rating: 5,
      toString: () => mockReviewId
    };

    const mockProduct = {
      _id: mockProductId,
      ratings: 5,
      numOfReviews: 1
    };

    // Setup mocks
    Product.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockProduct)
    });

    Review.findById = jest.fn().mockResolvedValue(mockReview);
    Review.findByIdAndDelete = jest.fn().mockResolvedValue(true);
    Product.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

    // 2. Mock Request as Attacker (UserB)
    const req = {
      query: {
        productId: mockProductId,
        id: mockReviewId
      },
      user: {
        _id: attackerId,
        role: 'user',
        name: 'Attacker'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    // 3. Attempt Deletion
    await productController.deleteReview(req, res, next);

    // 4. Assertions
    expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(403);
  });

  it('should allow review owner to delete their review', async () => {
    // 1. Setup Data
    const mockReview = {
      _id: mockReviewId,
      user: ownerId,
      rating: 5,
      toString: () => mockReviewId
    };

    const mockProduct = {
      _id: mockProductId,
      ratings: 5,
      numOfReviews: 1
    };

    // Setup mocks
    Product.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockProduct)
    });

    Review.findById = jest.fn().mockResolvedValue(mockReview);
    Review.findByIdAndDelete = jest.fn().mockResolvedValue(true);
    Product.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
    Product.updateOne = jest.fn().mockResolvedValue(true);
    Review.aggregate = jest.fn().mockResolvedValue([{ numOfReviews: 0, avgRating: 0 }]);

    // 2. Mock Request as Owner (UserA)
    const req = {
      query: {
        productId: mockProductId,
        id: mockReviewId
      },
      user: {
        _id: ownerId,
        role: 'user',
        name: 'Owner'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    // 3. Attempt Deletion
    await productController.deleteReview(req, res, next);

    // 4. Assert Success (200 OK)
    expect(next).not.toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
