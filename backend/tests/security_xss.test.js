const productController = require('../controllers/productController');
const Product = require('../models/productModel');
const ErrorHandler = require('../utlis/errorhandler');

// Mock dependencies
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
      upload_stream: jest.fn(),
    },
  },
}), { virtual: true });

jest.mock('../models/productModel', () => ({
  findOne: jest.fn(),
  updateOne: jest.fn(),
}));

jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => Promise.resolve(func(req, res, next)).catch(next));

describe('Security: XSS Prevention in Reviews', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {
                rating: 5,
                comment: '<script>alert("XSS")</script>',
                productId: 'product123'
            },
            user: {
                _id: 'user123',
                name: 'Test User'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should sanitize review comments to prevent XSS (Stored XSS)', async () => {
        // Mock product found
        Product.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                _id: 'product123',
                reviews: [],
                ratings: 0,
                numOfReviews: 0
            })
        });

        await productController.createProductReview(req, res, next);

        expect(Product.updateOne).toHaveBeenCalledWith(
            { _id: 'product123' },
            expect.objectContaining({
                $push: {
                    reviews: expect.objectContaining({
                        comment: 'alert("XSS")' // Tags should be stripped
                    })
                }
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
    });
});
