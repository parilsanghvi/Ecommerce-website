const productController = require('../controllers/productController');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');

// Mocks must be defined before use
jest.mock('../models/productModel', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/reviewModel', () => ({
  find: jest.fn(),
}));

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
      upload_stream: jest.fn(),
    },
  },
}));

// Mock catchAsyncErrors to behave like the real middleware
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => Promise.resolve(func(req, res, next)).catch(next));

const mockRequest = (query = {}) => ({ query });

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Product Controller - getProductReviews', () => {
    let mockProductQuery;
    let mockReviewQuery;

    beforeEach(() => {
        jest.clearAllMocks();

        mockProductQuery = {
            select: jest.fn().mockReturnThis(),
            lean: jest.fn()
        };
        Product.findById.mockReturnValue(mockProductQuery);

        mockReviewQuery = {
            lean: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            then: jest.fn()
        };
        Review.find.mockReturnValue(mockReviewQuery);
    });

    it('should return 404 if product not found', async () => {
        mockProductQuery.lean.mockResolvedValue(null);
        const req = mockRequest({ id: 'invalid_id' });
        const res = mockResponse();

        await productController.getProductReviews(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockNext.mock.calls[0][0].message).toBe('product not found');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });

    it('should return reviews without pagination if limit is not provided', async () => {
        mockProductQuery.lean.mockResolvedValue({ _id: 'prod_1', numOfReviews: 2 });
        const mockReviews = [{ id: 'rev1' }, { id: 'rev2' }];

        // Mock that when the query is awaited, it returns mockReviews
        mockReviewQuery.then = jest.fn((resolve) => resolve(mockReviews));

        const req = mockRequest({ id: 'prod_1' });
        const res = mockResponse();

        await productController.getProductReviews(req, res, mockNext);

        expect(Product.findById).toHaveBeenCalledWith('prod_1');
        expect(Review.find).toHaveBeenCalledWith({ product: 'prod_1' });
        expect(mockReviewQuery.skip).not.toHaveBeenCalled();
        expect(mockReviewQuery.limit).not.toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            reviews: mockReviews,
            totalReviews: 2,
            page: 1,
            limit: 0
        });
    });

    it('should return reviews with pagination if limit is provided', async () => {
        mockProductQuery.lean.mockResolvedValue({ _id: 'prod_1', numOfReviews: 5 });
        const mockReviews = [{ id: 'rev3' }];

        // Mock that when the chained query is awaited, it returns mockReviews
        mockReviewQuery.then = jest.fn((resolve) => resolve(mockReviews));
        // And mock the limit method to return the same query object
        mockReviewQuery.limit.mockReturnValue(mockReviewQuery);

        const req = mockRequest({ id: 'prod_1', page: '2', limit: '1' });
        const res = mockResponse();

        await productController.getProductReviews(req, res, mockNext);

        expect(Review.find).toHaveBeenCalledWith({ product: 'prod_1' });
        expect(mockReviewQuery.skip).toHaveBeenCalledWith(1);
        expect(mockReviewQuery.limit).toHaveBeenCalledWith(1);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            reviews: mockReviews,
            totalReviews: 5,
            page: 2,
            limit: 1
        });
    });

    it('should calculate skip correctly for different pages', async () => {
        mockProductQuery.lean.mockResolvedValue({ _id: 'prod_1', numOfReviews: 10 });
        mockReviewQuery.then = jest.fn((resolve) => resolve([]));
        mockReviewQuery.limit.mockReturnValue(mockReviewQuery);

        const req = mockRequest({ id: 'prod_1', page: '3', limit: '2' });
        const res = mockResponse();

        await productController.getProductReviews(req, res, mockNext);

        expect(mockReviewQuery.skip).toHaveBeenCalledWith(4); // (3 - 1) * 2 = 4
        expect(mockReviewQuery.limit).toHaveBeenCalledWith(2);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            page: 3,
            limit: 2
        }));
    });
});
