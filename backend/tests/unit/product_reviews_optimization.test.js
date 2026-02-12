// Mock cloudinary
jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn(),
        },
    },
}));

const productController = require('../../controllers/productController');
const Product = require('../../models/productModel');

// Mock Mongoose model
jest.mock('../../models/productModel', () => ({
    findById: jest.fn(),
}));

// Mock ErrorHandler
jest.mock('../../utlis/errorhandler', () => {
    return class ErrorHandler extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    };
});

describe('getProductReviews Optimization', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            query: {
                id: 'product_id_123'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should select only reviews field and use lean()', async () => {
        // Mock the chain: findById -> select -> lean
        const mockLean = jest.fn().mockResolvedValue({
            reviews: []
        });
        const mockSelect = jest.fn().mockReturnValue({
            lean: mockLean
        });

        // Setup the mock to support both optimized and unoptimized paths for verification
        Product.findById.mockReturnValue({
            select: mockSelect,
            lean: mockLean // For the unoptimized code which calls findById().lean()
        });

        await productController.getProductReviews(req, res, next);

        // Verify that select('reviews') was called
        expect(Product.findById).toHaveBeenCalledWith('product_id_123');
        expect(mockSelect).toHaveBeenCalledWith('reviews');
        expect(mockLean).toHaveBeenCalled();
    });
});
