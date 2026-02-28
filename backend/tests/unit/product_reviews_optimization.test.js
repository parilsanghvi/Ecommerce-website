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
        expect(Product.findOne).toHaveBeenCalledWith(
            { _id: 'productId123' },
            { ratings: 1, numOfReviews: 1, reviews: { $elemMatch: { user: 'userId123' } } }
        );

        expect(Product.updateOne).toHaveBeenCalledWith(
            { _id: 'productId123' },
            [
                {
                    $set: {
                        reviews: {
                            $concatArrays: [
                                { $ifNull: ["$reviews", []] },
                                [
                                    expect.objectContaining({
                                        user: 'userId123',
                                        name: 'Test User',
                                        rating: 5,
                                        comment: 'Great product'
                                    })
                                ]
                            ]
                        }
                    }
                },
                {
                    $set: {
                        numOfReviews: { $size: "$reviews" },
                        ratings: { $avg: "$reviews.rating" }
                    }
                }
            ],
            { updatePipeline: true }
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

        expect(Product.updateOne).toHaveBeenCalledWith(
            { _id: 'productId123', "reviews.user": 'userId123' },
            [
                {
                    $set: {
                        "reviews": {
                            $map: {
                                input: "$reviews",
                                as: "r",
                                in: {
                                    $cond: [
                                        { $eq: ["$$r.user", 'userId123'] },
                                        {
                                            $mergeObjects: [
                                                "$r",
                                                {
                                                    rating: 5,
                                                    comment: 'Great product'
                                                }
                                            ]
                                        },
                                        "$$r"
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $set: {
                        ratings: { $avg: "$reviews.rating" }
                    }
                }
            ],
            { updatePipeline: true }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });
});
