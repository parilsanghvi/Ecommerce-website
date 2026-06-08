const mongoose = require('mongoose');
const ErrorHandler = require('../../utils/errorhandler');
const productController = require('../../controllers/productController');
const Product = require('../../models/productModel');
const Review = require('../../models/reviewModel');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../../middleware/catchAsyncErrors', () => (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Mock Models
jest.mock('../../models/productModel');
jest.mock('../../models/reviewModel');

describe('deleteReview Unit Tests', () => {
  const mockProductId = new mongoose.Types.ObjectId().toString();
  const mockReviewId = new mongoose.Types.ObjectId().toString();
  const ownerId = new mongoose.Types.ObjectId().toString();
  const adminId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = (query = {}, user = {}) => ({ query, user });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  it('should return 404 if product is not found', async () => {
    const req = mockRequest({ productId: mockProductId });
    const res = mockResponse();

    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    });

    await productController.deleteReview(req, res, mockNext);

    expect(Product.findOne).toHaveBeenCalledWith(
      { _id: mockProductId },
      { ratings: 1, numOfReviews: 1 }
    );
    expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(mockNext.mock.calls[0][0].message).toBe('product not found');
    expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
  });

  it('should return 400 if review ID is invalid', async () => {
    const req = mockRequest({ productId: mockProductId, id: 'invalid-id' });
    const res = mockResponse();

    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: mockProductId })
    });

    await productController.deleteReview(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(mockNext.mock.calls[0][0].message).toBe('Invalid Review ID');
    expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
  });

  it('should return 404 if review is not found', async () => {
    const req = mockRequest({ productId: mockProductId, id: mockReviewId });
    const res = mockResponse();

    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: mockProductId })
    });
    Review.findById.mockResolvedValue(null);

    await productController.deleteReview(req, res, mockNext);

    expect(Review.findById).toHaveBeenCalledWith(mockReviewId);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(mockNext.mock.calls[0][0].message).toBe('Review not found');
    expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
  });

  it('should return 403 if user is not authorized', async () => {
    const req = mockRequest(
      { productId: mockProductId, id: mockReviewId },
      { _id: new mongoose.Types.ObjectId().toString(), role: 'user' }
    );
    const res = mockResponse();

    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: mockProductId })
    });
    // ownerId vs req.user._id
    Review.findById.mockResolvedValue({ user: ownerId });

    await productController.deleteReview(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(mockNext.mock.calls[0][0].message).toBe('Not authorized to delete this review');
    expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
  });

  it('should allow admin to delete any review and update product stats', async () => {
    const req = mockRequest(
      { productId: mockProductId, id: mockReviewId },
      { _id: adminId, role: 'admin' }
    );
    const res = mockResponse();

    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: mockProductId })
    });
    Review.findById.mockResolvedValue({ user: ownerId, toString: () => mockReviewId });
    Review.findByIdAndDelete.mockResolvedValue(true);
    Review.aggregate.mockResolvedValue([{ _id: mockProductId, numOfReviews: 0, avgRating: 0 }]);
    Product.updateOne.mockResolvedValue(true);

    await productController.deleteReview(req, res, mockNext);

    expect(Review.findByIdAndDelete).toHaveBeenCalledWith(mockReviewId);
    expect(Review.aggregate).toHaveBeenCalled();
    expect(Product.updateOne).toHaveBeenCalledWith(
      { _id: mockProductId },
      {
        $set: {
          ratings: 0,
          numOfReviews: 0
        }
      }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('should calculate true average after deletion successfully', async () => {
    const req = mockRequest(
      { productId: mockProductId, id: mockReviewId },
      { _id: ownerId, role: 'user' }
    );
    const res = mockResponse();

    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: mockProductId })
    });
    Review.findById.mockResolvedValue({ user: ownerId, toString: () => mockReviewId });
    Review.findByIdAndDelete.mockResolvedValue(true);

    const mockStats = [{ _id: mockProductId, numOfReviews: 5, avgRating: 4.5 }];
    Review.aggregate.mockResolvedValue(mockStats);

    Product.updateOne.mockResolvedValue(true);

    await productController.deleteReview(req, res, mockNext);

    expect(Review.aggregate).toHaveBeenCalledWith([
      { $match: { product: new mongoose.Types.ObjectId(mockProductId) } },
      {
        $group: {
          _id: '$product',
          numOfReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    expect(Product.updateOne).toHaveBeenCalledWith(
      { _id: mockProductId },
      {
        $set: {
          ratings: 4.5,
          numOfReviews: 5
        }
      }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('should handle zero reviews after deletion', async () => {
    const req = mockRequest(
      { productId: mockProductId, id: mockReviewId },
      { _id: ownerId, role: 'user' }
    );
    const res = mockResponse();

    Product.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: mockProductId })
    });
    Review.findById.mockResolvedValue({ user: ownerId, toString: () => mockReviewId });
    Review.findByIdAndDelete.mockResolvedValue(true);

    // Empty aggregate results mean no reviews left
    Review.aggregate.mockResolvedValue([]);

    Product.updateOne.mockResolvedValue(true);

    await productController.deleteReview(req, res, mockNext);

    expect(Product.updateOne).toHaveBeenCalledWith(
      { _id: mockProductId },
      {
        $set: {
          ratings: 0,
          numOfReviews: 0
        }
      }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
