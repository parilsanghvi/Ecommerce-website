
const productController = require('../../controllers/productController');
const Product = require('../../models/productModel');
const Apifeatures = require('../../utils/apifeatures');

// Mock catchAsyncErrors
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next).catch(next));

// Mock Mongoose Product model
jest.mock('../../models/productModel');

describe('Product Count Optimization', () => {
    let req, res, next;
    let mockQuery;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock query chain
        mockQuery = {
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]), // productsPromise
            clone: jest.fn().mockReturnThis(),
            countDocuments: jest.fn().mockResolvedValue(5), // filteredProductsCount
        };

        // Mock Product methods
        Product.find.mockReturnValue(mockQuery);
        Product.estimatedDocumentCount.mockResolvedValue(10); // productsCount

        // Setup Request/Response
        req = {
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should use countDocuments() when filters are applied (keyword)', async () => {
        req.query = { keyword: 'apple' };

        await productController.getAllProducts(req, res, next);

        if (next.mock.calls.length > 0) {
            console.error('Error in controller:', next.mock.calls[0][0]);
        }

        expect(Product.estimatedDocumentCount).toHaveBeenCalled();
        expect(mockQuery.clone).toHaveBeenCalled();
        expect(mockQuery.countDocuments).toHaveBeenCalled();

        // filteredProductsCount should be from countDocuments (5)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            filteredProductsCount: 5,
            productsCount: 10
        }));
    });

    it('should use countDocuments() when filters are applied (category)', async () => {
        req.query = { category: 'electronics' };

        await productController.getAllProducts(req, res, next);

        expect(Product.estimatedDocumentCount).toHaveBeenCalled();
        expect(mockQuery.clone).toHaveBeenCalled();
        expect(mockQuery.countDocuments).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            filteredProductsCount: 5,
            productsCount: 10
        }));
    });

    it('should SKIP countDocuments() when NO filters are applied', async () => {
        req.query = { page: '1' }; // Pagination only

        await productController.getAllProducts(req, res, next);

        expect(Product.estimatedDocumentCount).toHaveBeenCalled();

        // This is the optimization we expect:
        // mockQuery.countDocuments should NOT be called if we optimize it.
        // BUT currently (before optimization), it IS called.
        // So initially, this test should FAIL or we assert it IS called to prove baseline.

        // Optimization: countDocuments should NOT be called
        expect(mockQuery.countDocuments).not.toHaveBeenCalled();

        // And we should still get the correct count (from estimatedDocumentCount which is 10)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            filteredProductsCount: 10,
            productsCount: 10
        }));
    });
});
