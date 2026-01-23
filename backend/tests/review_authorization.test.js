
const ErrorHandler = require('../utlis/errorhandler');
const productController = require('../controllers/productController');
const Product = require('../models/productModel');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

// Mock Product Model
jest.mock('../models/productModel');

describe('deleteReview Authorization Security Test', () => {
  it('should prevent unauthorized users from deleting reviews they do not own', async () => {
    // 1. Setup Data
    const mockReview = {
        _id: { toString: () => 'rev1' },
        user: { toString: () => 'userA' },
        rating: 5
    };

    const mockProduct = {
      _id: 'prod1',
      reviews: [mockReview],
      // deleteReview accesses product.reviews directly
    };

    // Setup mocks
    Product.findById.mockResolvedValue(mockProduct);
    Product.findByIdAndUpdate.mockResolvedValue(true);

    // 2. Mock Request as Attacker (UserB)
    const req = {
      query: {
        productId: 'prod1',
        id: 'rev1'
      },
      user: {
        _id: { toString: () => 'userB' },
        role: 'user',
        name: 'Attacker'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    // 3. Attempt Deletion
    await productController.deleteReview(req, res, next);

    // 4. Assertions
    // We expect 403. If the vulnerability exists, next won't be called with 403, and res.status(200) will be called.
    try {
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(403);
    } catch (e) {
        // If it failed to be 403, check if it was 200 (Success) to confirm vulnerability
        if (res.status.mock.calls.length > 0 && res.status.mock.calls[0][0] === 200) {
            console.log("VULNERABILITY CONFIRMED: Unauthorized deletion succeeded with status 200");
            throw new Error("Security Vulnerability: Unauthorized user was able to delete review!");
        } else {
            throw e;
        }
    }
  });

  it('should allow review owner to delete their review', async () => {
    // 1. Setup Data
    const mockReview = {
        _id: { toString: () => 'rev1' },
        user: { toString: () => 'userA' },
        rating: 5
    };

    const mockProduct = {
      _id: 'prod1',
      reviews: [mockReview],
    };

    Product.findById.mockResolvedValue(mockProduct);
    Product.findByIdAndUpdate.mockResolvedValue(true);

    // 2. Mock Request as Owner (UserA)
    const req = {
      query: {
        productId: 'prod1',
        id: 'rev1'
      },
      user: {
        _id: { toString: () => 'userA' },
        role: 'user',
        name: 'Owner'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    // 3. Attempt Deletion
    await productController.deleteReview(req, res, next);

    // 4. Assert Success (200 OK)
    expect(next).not.toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
