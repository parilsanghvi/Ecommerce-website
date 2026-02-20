const productController = require('../../controllers/productController');
const Product = require('../../models/productModel');
const ErrorHandler = require('../../utlis/errorhandler');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

// Mock Product Model
jest.mock('../../models/productModel');

describe('deleteReview Optimization Test', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            query: {
                productId: 'prod123',
                id: 'rev123'
            },
            user: {
                _id: 'user123',
                role: 'user'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should use optimized query and atomic update', async () => {
        // Setup Mock Data
        const mockReview = {
            _id: 'rev123',
            user: 'user123',
            rating: 5,
            comment: 'Great!'
        };

        const mockProduct = {
            _id: 'prod123',
            ratings: 4.5,
            numOfReviews: 2,
            reviews: [mockReview] // Simulate finding the specific review
        };

        // Mock findById chain: Product.findById().select().lean()
        const mockQuery = {
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockProduct)
        };
        Product.findById.mockReturnValue(mockQuery);

        Product.findByIdAndUpdate.mockResolvedValue(true);

        // Execute Controller
        await productController.deleteReview(req, res, next);

        // Verify Optimization
        // 1. Check if select() was called with correct projection
        expect(Product.findById).toHaveBeenCalledWith('prod123');
        expect(mockQuery.select).toHaveBeenCalledWith(expect.objectContaining({
            reviews: { $elemMatch: { _id: 'rev123' } },
            ratings: 1,
            numOfReviews: 1
        }));
        expect(mockQuery.lean).toHaveBeenCalled();

        // 2. Verify Calculation
        // Old Avg: 4.5, Count: 2. Total: 9.
        // Review Rating: 5.
        // New Total: 9 - 5 = 4.
        // New Count: 1.
        // New Avg: 4 / 1 = 4.

        // 3. Verify Atomic Update
        expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
            'prod123',
            expect.objectContaining({
                $pull: { reviews: { _id: 'rev123' } },
                $set: { ratings: 4, numOfReviews: 1 }
            }),
            expect.anything()
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should handle edge case: last review deleted', async () => {
        const mockReview = {
            _id: 'rev123',
            user: 'user123',
            rating: 5
        };

        const mockProduct = {
            _id: 'prod123',
            ratings: 5,
            numOfReviews: 1,
            reviews: [mockReview]
        };

        const mockQuery = {
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockProduct)
        };
        Product.findById.mockReturnValue(mockQuery);
        Product.findByIdAndUpdate.mockResolvedValue(true);

        await productController.deleteReview(req, res, next);

        expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
            'prod123',
            expect.objectContaining({
                $set: { ratings: 0, numOfReviews: 0 }
            }),
            expect.anything()
        );
    });
});
