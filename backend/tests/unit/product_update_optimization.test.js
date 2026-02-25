const productController = require('../../controllers/productController');
const Product = require('../../models/productModel');
const imageHandler = require('../../utlis/imageHandler');

// Mock dependencies
jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            destroy: jest.fn(),
            upload: jest.fn(),
        }
    }
}));

jest.mock('../../models/productModel', () => ({
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));

jest.mock('../../utlis/imageHandler', () => ({
    processImagesUpdate: jest.fn(),
}));

// Mock catchAsyncErrors to execute the controller
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

describe('Product Controller - Update Optimization', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 'product123' },
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should NOT fetch product (findById) if images are NOT present in req.body', async () => {
        // Setup: No images in req.body
        req.body = { name: 'Updated Name', price: 100 };

        // Mock findByIdAndUpdate to return updated product
        Product.findByIdAndUpdate.mockResolvedValue({ _id: 'product123', name: 'Updated Name' });

        await productController.updateProduct(req, res, next);

        // Assertion: findById should NOT be called (Optimization)
        expect(Product.findById).not.toHaveBeenCalled();

        // Assertion: findByIdAndUpdate should be called
        expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
            'product123',
            req.body,
            expect.any(Object)
        );

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should fetch product (findById) if images ARE present in req.body', async () => {
        // Setup: Images in req.body
        req.body = {
            name: 'Updated Name',
            images: ['new_image_url']
        };

        // Mock findById to return existing product (needed for image processing)
        Product.findById.mockResolvedValue({
            _id: 'product123',
            images: [{ public_id: 'old_id', url: 'old_url' }]
        });

        // Mock image processing
        imageHandler.processImagesUpdate.mockResolvedValue([{ public_id: 'new_id', url: 'new_url' }]);

        // Mock findByIdAndUpdate
        Product.findByIdAndUpdate.mockResolvedValue({ _id: 'product123', name: 'Updated Name' });

        await productController.updateProduct(req, res, next);

        // Assertion: findById MUST be called
        expect(Product.findById).toHaveBeenCalledWith('product123');

        // Assertion: processImagesUpdate MUST be called
        expect(imageHandler.processImagesUpdate).toHaveBeenCalled();

        // Assertion: findByIdAndUpdate should be called
        expect(Product.findByIdAndUpdate).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
    });
});
