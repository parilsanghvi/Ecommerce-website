const Product = require('../../models/productModel');

// Mock catchAsyncErrors to return the promise so we can await it in tests
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));
jest.mock('../../models/productModel');

const productController = require('../../controllers/productController');

describe('Product Controller - deleteReview Optimization', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            query: {
                id: 'reviewId123',
                productId: 'productId123'
            },
            user: { _id: 'userId123', role: 'user' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should delete review using atomic update and minimal fetch', async () => {
        // Mock finding the product with projection
        // The implementation should use findOne with projection to fetch only necessary fields
        // Returns the product with the specific review to be deleted
        Product.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                _id: 'productId123',
                ratings: 4,
                numOfReviews: 10,
                reviews: [{ _id: 'reviewId123', user: 'userId123', rating: 4, comment: 'Good' }]
            })
        });

        Product.findByIdAndUpdate.mockResolvedValue({ modifiedCount: 1 });

        await productController.deleteReview(req, res, next);

        // Verify findOne was called with projection (O(1) fetch)
        expect(Product.findOne).toHaveBeenCalledWith(
            { _id: 'productId123' },
            { ratings: 1, numOfReviews: 1, reviews: { $elemMatch: { _id: 'reviewId123' } } }
        );

        // Verify atomic update
        // Old avg = 4, count = 10. Total = 40.
        // Removed rating = 4.
        // New total = 36.
        // New count = 9.
        // New avg = 36 / 9 = 4.

        expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
            'productId123',
            expect.objectContaining({
                $pull: { reviews: { _id: 'reviewId123' } },
                $set: {
                    ratings: 4,
                    numOfReviews: 9
                }
            }),
            expect.anything()
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should correctly recalculate ratings when deleting a review', async () => {
         // Mock finding the product with projection
        Product.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                _id: 'productId123',
                ratings: 4.5,
                numOfReviews: 2,
                reviews: [{ _id: 'reviewId123', user: 'userId123', rating: 5 }]
            })
        });

        Product.findByIdAndUpdate.mockResolvedValue({ modifiedCount: 1 });

        await productController.deleteReview(req, res, next);

        // Old avg = 4.5, count = 2. Total = 9.
        // Removed rating = 5.
        // New total = 4.
        // New count = 1.
        // New avg = 4.

        expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
            'productId123',
            expect.objectContaining({
                $set: {
                    ratings: 4,
                    numOfReviews: 1
                }
            }),
            expect.anything()
        );
    });
});
