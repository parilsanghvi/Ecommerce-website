const ErrorHandler = require('../utils/errorhandler');
const mongoose = require('mongoose');
const productController = require('../controllers/productController');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

// Mock Product Model
jest.mock('../models/productModel');
jest.mock('../models/reviewModel');

describe('deleteReview Authorization Security Test', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      query: { id: new mongoose.Types.ObjectId(), productId: new mongoose.Types.ObjectId() },
      user: { _id: new mongoose.Types.ObjectId(), role: 'user' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  it('should prevent unauthorized users from deleting reviews they do not own', async () => {
    const mockReview = {
      _id: req.query.id,
      user: new mongoose.Types.ObjectId(), // Different user
      rating: 4,
    };

    const mockProduct = {
      _id: req.query.productId,
      ratings: 4,
      numOfReviews: 1
    };

    Product.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockProduct) });
    Review.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockReview) });

    await productController.deleteReview(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(next.mock.calls[0][0].message).toBe("Not authorized to delete this review");
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('should allow review owner to delete their review', async () => {
    const mockReview = {
      _id: req.query.id,
      user: req.user._id, // Same user
      rating: 4,
    };

    const mockProduct = {
      _id: req.query.productId,
      ratings: 4,
      numOfReviews: 1
    };

    Product.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockProduct) });
    Review.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockReview) });
    Review.findByIdAndDelete = jest.fn();
    Product.findByIdAndUpdate = jest.fn();

    await productController.deleteReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(Review.findByIdAndDelete).toHaveBeenCalledWith(req.query.id);
  });
});