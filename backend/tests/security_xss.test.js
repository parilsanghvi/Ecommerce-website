const productController = require('../controllers/productController');
const Product = require('../models/productModel');

// Mock Mongoose model
jest.mock('../models/productModel', () => ({
    findOne: jest.fn(),
    updateOne: jest.fn(),
    findById: jest.fn(),
}));

// Mock cloudinary
jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn()
        }
    }
}));

// Mock catchAsyncErrors to execute the controller
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

describe('Security: XSS in Product Reviews', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { _id: 'user123', name: 'Test User' },
            body: {
                rating: 5,
                comment: '<script>alert("XSS")</script>',
                productId: 'product123'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should sanitize HTML tags when CREATING a new review', async () => {
        // Mock product found, no existing review
        Product.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                _id: 'product123',
                ratings: 4,
                numOfReviews: 1,
                reviews: []
            })
        });

        // Mock updateOne
        Product.updateOne.mockResolvedValue({});

        await productController.createProductReview(req, res, next);

        // Verify that updateOne was called
        expect(Product.updateOne).toHaveBeenCalled();

        // Get the arguments passed to updateOne
        const updateArgs = Product.updateOne.mock.calls[0][1];

        // Check if the comment in $push.reviews is sanitized
        const storedComment = updateArgs.$push.reviews.comment;

        expect(storedComment).not.toContain('<script>');
        expect(storedComment).not.toContain('</script>');
        // Expect escaped output instead of stripped
        // validator.escape() escapes / to &#x2F;
        expect(storedComment).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should sanitize HTML tags when UPDATING an existing review', async () => {
        // Mock product found, WITH existing review
        Product.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                _id: 'product123',
                ratings: 4,
                numOfReviews: 1,
                reviews: [
                    {
                        user: 'user123',
                        rating: 4,
                        comment: 'Old comment'
                    }
                ]
            })
        });

        // Mock updateOne
        Product.updateOne.mockResolvedValue({});

        await productController.createProductReview(req, res, next);

        // Verify that updateOne was called
        expect(Product.updateOne).toHaveBeenCalled();

        // Get the arguments passed to updateOne
        const updateArgs = Product.updateOne.mock.calls[0][1];

        // Check if the comment in $set is sanitized
        const storedComment = updateArgs.$set["reviews.$.comment"];

        expect(storedComment).not.toContain('<script>');
        expect(storedComment).not.toContain('</script>');
        // Expect escaped output instead of stripped
        // validator.escape() escapes / to &#x2F;
        expect(storedComment).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });
});
