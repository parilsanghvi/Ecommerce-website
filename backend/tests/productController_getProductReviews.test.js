// Use virtual mock to handle broken dependencies
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn()
    }
  }
}), { virtual: true });

jest.mock('validator', () => ({
  isMongoId: jest.fn()
}), { virtual: true });

const productController = require('../controllers/productController');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');
const ErrorHandler = require('../utils/errorhandler');

// Mock models
jest.mock('../models/productModel', () => ({
  findById: jest.fn()
}));
jest.mock('../models/reviewModel', () => ({
  find: jest.fn()
}));

// Mock catchAsyncErrors to behave like the real middleware
jest.mock('../middleware/catchAsyncErrors', () => (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (error) {
    next(error);
  }
});

const mockRequest = (query = {}) => ({ query });
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

describe('getProductReviews Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if product is not found', async () => {
    const req = mockRequest({ id: 'nonexistent' });
    const res = mockResponse();

    // Setup mock chain for Product.findById().select().lean()
    const leanMock = jest.fn().mockResolvedValue(null);
    const selectMock = jest.fn().mockReturnValue({ lean: leanMock });
    Product.findById.mockReturnValue({ select: selectMock });

    await productController.getProductReviews(req, res, mockNext);

    expect(Product.findById).toHaveBeenCalledWith('nonexistent');
    expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(mockNext.mock.calls[0][0].message).toBe('product not found');
    expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
  });

  it('should return all reviews for a product without pagination', async () => {
    const req = mockRequest({ id: 'product1' });
    const res = mockResponse();

    const mockProduct = { _id: 'product1', numOfReviews: 2 };
    const mockReviews = [
      { _id: 'review1', rating: 5, comment: 'Great' },
      { _id: 'review2', rating: 4, comment: 'Good' }
    ];

    // Mock Product lookup
    const productLeanMock = jest.fn().mockResolvedValue(mockProduct);
    const productSelectMock = jest.fn().mockReturnValue({ lean: productLeanMock });
    Product.findById.mockReturnValue({ select: productSelectMock });

    // Mock Review lookup
    // Based on controller: let reviewQuery = Review.find({ product: req.query.id }).lean();
    const reviewLeanMock = jest.fn().mockResolvedValue(mockReviews);
    Review.find.mockReturnValue({ lean: reviewLeanMock });

    await productController.getProductReviews(req, res, mockNext);

    expect(Product.findById).toHaveBeenCalledWith('product1');
    expect(Review.find).toHaveBeenCalledWith({ product: 'product1' });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      reviews: mockReviews,
      totalReviews: 2,
      page: 1,
      limit: 0
    });
  });

  it('should return paginated reviews for a product', async () => {
    const req = mockRequest({ id: 'product2', page: '2', limit: '5' });
    const res = mockResponse();

    const mockProduct = { _id: 'product2', numOfReviews: 12 };
    const mockReviews = Array.from({ length: 5 }, (_, i) => ({ _id: `review${i}`, rating: 5 }));

    // Mock Product lookup
    const productLeanMock = jest.fn().mockResolvedValue(mockProduct);
    const productSelectMock = jest.fn().mockReturnValue({ lean: productLeanMock });
    Product.findById.mockReturnValue({ select: productSelectMock });

    // Mock Review lookup with skip and limit
    // Because it modifies the query returned by find().lean(), we must mock it carefully.
    // So .lean() returns an object that has .skip(), which returns an object that has .limit(), which is awaitable.

    const limitMock = jest.fn().mockResolvedValue(mockReviews);
    const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
    const reviewLeanMock = jest.fn().mockReturnValue({ skip: skipMock });
    Review.find.mockReturnValue({ lean: reviewLeanMock });

    await productController.getProductReviews(req, res, mockNext);

    expect(Product.findById).toHaveBeenCalledWith('product2');
    expect(Review.find).toHaveBeenCalledWith({ product: 'product2' });

    // Verify skip calculation: skip = (page - 1) * limit = (2 - 1) * 5 = 5
    expect(skipMock).toHaveBeenCalledWith(5);
    expect(limitMock).toHaveBeenCalledWith(5);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      reviews: mockReviews,
      totalReviews: 12,
      page: 2,
      limit: 5
    });
  });
});
