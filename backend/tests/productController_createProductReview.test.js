const mongoose = require('mongoose');
const ErrorHandler = require('../utils/errorhandler');
const { createProductReview } = require('../controllers/productController');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

// Mock Models
jest.mock('../models/productModel');
jest.mock('../models/reviewModel');

describe('createProductReview Integration Test', () => {
    let req;
    let res;
    let next;
    const mockProductId = new mongoose.Types.ObjectId().toString();
    const mockUserId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        req = {
            body: {
                rating: 4,
                comment: 'Great product!',
                productId: mockProductId
            },
            user: {
                _id: mockUserId,
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

    it('should create a new review if user has not reviewed the product', async () => {
        // Mock findOne to return null (no existing review)
        Review.findOne.mockResolvedValue(null);
        Review.create.mockResolvedValue({});

        // Mock aggregate for stats
        Review.aggregate.mockResolvedValue([
            { _id: mockProductId, numOfReviews: 1, avgRating: 4 }
        ]);

        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

        await createProductReview(req, res, next);

        // Assert review was created
        expect(Review.create).toHaveBeenCalledWith({
            product: mockProductId,
            user: mockUserId,
            name: 'Test User',
            rating: 4,
            comment: 'Great product!'
        });

        // Assert stats calculation occurred
        expect(Review.aggregate).toHaveBeenCalled();

        // Assert product was updated
        expect(Product.updateOne).toHaveBeenCalledWith(
            { _id: mockProductId },
            {
                $set: {
                    ratings: 4,
                    numOfReviews: 1
                }
            }
        );

        // Assert success response
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
        });
    });

    it('should update an existing review if user already reviewed the product', async () => {
        // Mock existing review
        const mockExistingReview = {
            rating: 3,
            comment: 'Old comment',
            save: jest.fn().mockResolvedValue(true)
        };

        Review.findOne.mockResolvedValue(mockExistingReview);

        // Mock aggregate for stats
        Review.aggregate.mockResolvedValue([
            { _id: mockProductId, numOfReviews: 1, avgRating: 4 }
        ]);

        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

        await createProductReview(req, res, next);

        // Assert review was NOT created but updated and saved
        expect(Review.create).not.toHaveBeenCalled();
        expect(mockExistingReview.rating).toBe(4);
        expect(mockExistingReview.comment).toBe('Great product!');
        expect(mockExistingReview.save).toHaveBeenCalled();

        // Assert stats calculation occurred
        expect(Review.aggregate).toHaveBeenCalled();

        // Assert success response
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should sanitize the comment to prevent XSS', async () => {
        req.body.comment = '<script>alert("xss")</script>';

        Review.findOne.mockResolvedValue(null);
        Review.create.mockResolvedValue({});
        Review.aggregate.mockResolvedValue([{ _id: mockProductId, numOfReviews: 1, avgRating: 4 }]);
        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

        await createProductReview(req, res, next);

        // Assert escaped comment
        expect(Review.create).toHaveBeenCalledWith(
            expect.objectContaining({
                comment: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
            })
        );
    });

    it('should return error if rating is invalid', async () => {
        req.body.rating = 6;

        await createProductReview(req, res, next);

        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[0][0];
        expect(err.message).toBe("Rating must be between 0 and 5");
        expect(err.statusCode).toBe(400);

        // Ensure no db calls are made
        expect(Review.findOne).not.toHaveBeenCalled();
    });
});
