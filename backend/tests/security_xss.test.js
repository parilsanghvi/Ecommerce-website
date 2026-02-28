const validator = require('validator');

// Mock models and services BEFORE requiring controllers
jest.mock('../models/productModel', () => ({
    findOne: jest.fn(),
    updateOne: jest.fn()
}));
jest.mock('../middleware/catchAsyncErrors', () => (fn) => fn);
jest.mock('cloudinary');

const Product = require('../models/productModel');
const productController = require('../controllers/productController');

describe('Security: XSS in Product Reviews', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { _id: 'user123', name: 'Test User' },
            body: {
                productId: 'product123',
                rating: 5,
                comment: '<script>alert("XSS")</script> Good product!'
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
        // Product found, no reviews
        Product.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                _id: 'product123',
                ratings: 4,
                numOfReviews: 10,
                reviews: []
            })
        });

        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

        await productController.createProductReview(req, res, next);

        expect(Product.updateOne).toHaveBeenCalled();

        // Extract the arguments passed to Product.updateOne
        const updateArgs = Product.updateOne.mock.calls[0][1];

        // The update is a pipeline, so find the object that sets the review
        // In the pipeline: [ { $set: { reviews: { $concatArrays: [ ... ] } } }, ... ]
        const setReviewsObj = updateArgs.find(step => step.$set && step.$set.reviews && step.$set.reviews.$concatArrays);
        const storedComment = setReviewsObj.$set.reviews.$concatArrays[1][0].comment;

        expect(storedComment).not.toContain('<script>');
        expect(storedComment).not.toContain('</script>');

        // Check exact encoding (validator.escape behavior)
        expect(storedComment).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt; Good product!');
    });

    it('should sanitize HTML tags when UPDATING an existing review', async () => {
        // Product found, with existing review by this user
        Product.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                _id: 'product123',
                ratings: 4,
                numOfReviews: 10,
                reviews: [{ user: 'user123', rating: 4, comment: 'Old comment' }]
            })
        });

        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

        await productController.createProductReview(req, res, next);

        expect(Product.updateOne).toHaveBeenCalled();

        // Extract the arguments passed to Product.updateOne
        const updateArgs = Product.updateOne.mock.calls[0][1];

        // The update is a pipeline, find the map operation that sets the comment
        const setReviewsObj = updateArgs.find(step => step.$set && step.$set.reviews && step.$set.reviews.$map);
        const storedComment = setReviewsObj.$set.reviews.$map.in.$cond[1].$mergeObjects[1].comment;

        expect(storedComment).not.toContain('<script>');
        expect(storedComment).not.toContain('</script>');

        // Check exact encoding (validator.escape behavior)
        expect(storedComment).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt; Good product!');
    });
});
