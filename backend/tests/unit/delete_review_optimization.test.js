
const productController = require('../../controllers/productController');
const Product = require('../../models/productModel');
const ErrorHandler = require('../../utlis/errorhandler');

jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));
jest.mock('../../models/productModel');

describe('deleteReview Optimization', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            query: { productId: 'prod1', id: 'rev1' },
            user: { _id: 'user1', role: 'user' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should use projection and $pull to delete review efficiently', async () => {
        // Mock findById chain
        const mockLean = jest.fn().mockResolvedValue({
            _id: 'prod1',
            reviews: [{ _id: 'rev1', user: 'user1', rating: 5 }],
            ratings: 4.5,
            numOfReviews: 10
        });
        const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });

        Product.findById.mockReturnValue({ select: mockSelect });

        // Mock findByIdAndUpdate
        Product.findByIdAndUpdate.mockResolvedValue(true);

        await productController.deleteReview(req, res, next);

        // Verify projection was used
        expect(Product.findById).toHaveBeenCalledWith('prod1');
        expect(mockSelect).toHaveBeenCalledWith({
            reviews: { $elemMatch: { _id: 'rev1' } },
            ratings: 1,
            numOfReviews: 1
        });

        // Verify update used atomic operators
        // New stats calculation verification:
        // old sum = 4.5 * 10 = 45
        // new sum = 45 - 5 = 40
        // new count = 9
        // new avg = 40 / 9 = 4.444...
        const expectedRating = 40 / 9;

        expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
            'prod1',
            {
                $pull: { reviews: { _id: 'rev1' } },
                $set: {
                    ratings: expectedRating,
                    numOfReviews: 9
                }
            },
            expect.objectContaining({
                new: true,
                runValidators: true
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle deleting the last review correctly', async () => {
        // Mock findById chain
        const mockLean = jest.fn().mockResolvedValue({
            _id: 'prod1',
            reviews: [{ _id: 'rev1', user: 'user1', rating: 5 }],
            ratings: 5,
            numOfReviews: 1
        });
        const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });

        Product.findById.mockReturnValue({ select: mockSelect });

        Product.findByIdAndUpdate.mockResolvedValue(true);

        await productController.deleteReview(req, res, next);

        expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
            'prod1',
            {
                $pull: { reviews: { _id: 'rev1' } },
                $set: {
                    ratings: 0,
                    numOfReviews: 0
                }
            },
            expect.any(Object)
        );
    });
});
