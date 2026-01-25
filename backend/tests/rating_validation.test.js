const Product = require('../models/productModel');

// Mock catchAsyncErrors to allow awaiting the controller function
// This must be done BEFORE importing the controller
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

const { createProductReview } = require('../controllers/productController');

// Mock Product model
jest.mock('../models/productModel');

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('Product Rating Validation Vulnerability', () => {
    it('should REJECT invalid rating with validation fix', async () => {
        // Mock data
        const req = {
            user: {
                _id: 'userid',
                name: 'Test User',
            },
            body: {
                rating: 100, // Invalid rating
                comment: 'This should fail now',
                productId: 'productid',
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        // Mock product instance
        const mockProductInstance = {
            _id: 'productid',
            reviews: [],
            ratings: 0,
            numOfReviews: 0,
            save: jest.fn().mockResolvedValue(true),
        };

        // Mock Product.findById to return the mock product
        Product.findById.mockResolvedValue(mockProductInstance);

        await createProductReview(req, res, next);

        // Verify that the invalid rating was REJECTED

        // 1. next() should be called with an error
        expect(next).toHaveBeenCalled();
        const errorArg = next.mock.calls[0][0];
        // ErrorHandler extends Error, so checking message is good
        expect(errorArg).toBeDefined();
        expect(errorArg.message).toMatch(/Rating must be between 0 and 5/i);
        // Also check status code if possible (ErrorHandler has statusCode)
        expect(errorArg.statusCode).toBe(400);

        // 2. Review should NOT be added
        expect(mockProductInstance.reviews).toHaveLength(0);

        // 3. Ratings should NOT be updated
        expect(mockProductInstance.ratings).toBe(0);

        // 4. Save should NOT be called
        expect(mockProductInstance.save).not.toHaveBeenCalled();
    });
});
