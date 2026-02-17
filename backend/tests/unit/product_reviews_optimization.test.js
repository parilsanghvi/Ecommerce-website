const Product = require('../../models/productModel');

// Mock catchAsyncErrors to return the promise so we can await it in tests
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));
jest.mock('../../models/productModel');
jest.mock('cloudinary');

const productController = require('../../controllers/productController');

describe('Product Controller - createProductReview Optimization', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { _id: 'userId123', name: 'Test User' },
            body: { rating: 5, comment: 'Great product', productId: 'productId123' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should add a new review using updateOne without fetching all reviews', async () => {
        // Mock finding the product with projection
        Product.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                _id: 'productId123',
                ratings: 4,
                numOfReviews: 10,
                reviews: [] // No review by this user
            })
        });

        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

        await productController.createProductReview(req, res, next);

        // Verify findOne was called with projection (O(1) fetch)
        // The implementation should use findOne with projection to fetch only necessary fields
        expect(Product.findOne).toHaveBeenCalledWith(
            { _id: 'productId123' },
            { ratings: 1, numOfReviews: 1, reviews: { $elemMatch: { user: 'userId123' } } }
        );

        // Verify updateOne was called correctly for NEW review
        // New avg calculation: (4 * 10 + 5) / 11 = 45 / 11 = 4.0909...
        const expectedRating = (40 + 5) / 11;

        expect(Product.updateOne).toHaveBeenCalledWith(
            { _id: 'productId123' },
            expect.objectContaining({
                $push: {
                    reviews: expect.objectContaining({
                        user: 'userId123',
                        name: 'Test User',
                        rating: 5,
                        comment: 'Great product'
                    })
                },
                $set: { ratings: expectedRating },
                $inc: { numOfReviews: 1 }
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should update an existing review using updateOne without fetching all reviews', async () => {
        // Mock finding the product with existing review
        Product.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                _id: 'productId123',
                ratings: 4,
                numOfReviews: 10,
                reviews: [{ user: 'userId123', rating: 3, comment: 'Old comment' }]
            })
        });

        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

        await productController.createProductReview(req, res, next);

        // Verify updateOne was called correctly for EXISTING review
        // Old avg = 4, count = 10. Total score = 40.
        // Old rating = 3. New rating = 5.
        // New total = 40 - 3 + 5 = 42.
        // New avg = 42 / 10 = 4.2.
        const expectedRating = (40 - 3 + 5) / 10;

        expect(Product.updateOne).toHaveBeenCalledWith(
            { _id: 'productId123', "reviews.user": 'userId123' },
            expect.objectContaining({
                $set: {
                    "reviews.$.rating": 5,
                    "reviews.$.comment": 'Great product',
                    ratings: expectedRating
                }
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });
});
