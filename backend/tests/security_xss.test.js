const productController = require('../controllers/productController');
const Product = require('../models/productModel');

// Mocks must be defined before use
jest.mock('../models/productModel', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  findOne: jest.fn(),
  deleteOne: jest.fn(),
}));

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

// Mock catchAsyncErrors to behave like the real middleware (execute and catch)
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => Promise.resolve(func(req, res, next)).catch(next));

const mockRequest = () => {
  const req = {};
  req.body = {};
  req.params = {};
  req.query = {};
  req.user = { id: 'userid', _id: 'userid', name: 'Test User' };
  return req;
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Product Controller - XSS Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProductReview', () => {
    it('should sanitize XSS payloads in review comments', async () => {
      const req = mockRequest();
      const res = mockResponse();

      const maliciousComment = "<script>alert('XSS')</script>";
      req.body = {
        rating: 5,
        comment: maliciousComment,
        productId: 'product_id'
      };

      // Mock Product.findOne().lean() to return a product
      const productMock = {
        _id: 'product_id',
        ratings: 4,
        numOfReviews: 1,
        reviews: []
      };

      Product.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(productMock)
      });

      Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await productController.createProductReview(req, res, mockNext);

      // Verify that Product.findOne was called correctly
      expect(Product.findOne).toHaveBeenCalledWith(
        { _id: 'product_id' },
        expect.any(Object)
      );

      // Verify that Product.updateOne was called with SANITIZED comment
      // The expected sanitized string depends on the exact implementation of escapeHtml
      // Expected output after stripping HTML tags: <script>... -> ...
      const expectedSanitizedComment = "alert('XSS')";

      expect(Product.updateOne).toHaveBeenCalledWith(
        expect.anything(), // Filter query
        expect.objectContaining({
          $push: expect.objectContaining({
            reviews: expect.objectContaining({
              comment: expectedSanitizedComment
            })
          })
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
