const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ErrorHandler = require("../utils/errorhandler");

// Mock catchAsyncErrors to allow awaiting the controller function and catching next() calls
jest.mock('../middleware/catchAsyncErrors', () => (func) => async (req, res, next) => {
    try {
        await func(req, res, next);
    } catch (error) {
        next(error);
    }
});

const mockStripeRetrieve = jest.fn();
jest.mock('stripe', () => () => ({
    paymentIntents: {
        retrieve: mockStripeRetrieve
    }
}));

const orderController = require('../controllers/orderController');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');

let mongoServer;
let testUser;
let testProduct;
let mockRes;
let mockNext;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.4' } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    if(mongoServer) if(mongoServer) { await mongoServer.stop(); };
});

beforeEach(async () => {
    jest.clearAllMocks();
    await Order.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    testUser = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        avatar: { public_id: "avatar_id", url: "avatar_url" }
    });

    testProduct = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 100,
        ratings: 0,
        images: [{ public_id: "image_id", url: "image_url" }],
        category: "Test Category",
        stock: 10,
        numOfReviews: 0,
        user: testUser._id
    });

    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
    mockNext = jest.fn();
});

describe('newOrder Controller', () => {
    jest.setTimeout(60000);

    const validShippingInfo = {
        address: "123 Main St",
        city: "City",
        state: "State",
        country: "Country",
        pinCode: 123456,
        phoneNo: 1234567890
    };

    const getValidReqBody = () => {
        // Items Price: 100 * 2 = 200
        // Tax (18%): 36
        // Shipping (<= 1000): 200
        // Total: 200 + 36 + 200 = 436
        return {
            shippingInfo: validShippingInfo,
            orderItems: [{
                name: "Test Product",
                price: 100,
                quantity: 2,
                image: "image_url",
                product: testProduct._id
            }],
            paymentInfo: {
                id: "pi_test_123",
                status: "succeeded"
            },
            itemsPrice: 200,
            taxPrice: 36,
            shippingPrice: 200,
            totalPrice: 436
        };
    };

    it('should create a new order successfully', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };

        mockStripeRetrieve.mockResolvedValueOnce({
            status: "succeeded",
            amount: 43600 // 436 * 100
        });

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                order: expect.objectContaining({
                    itemsPrice: 200,
                    totalPrice: 436
                })
            })
        );
    });

    it('should fail with invalid quantity (<= 0)', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.orderItems[0].quantity = 0;

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Invalid quantity for product');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should fail with non-integer quantity', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.orderItems[0].quantity = 1.5;

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Invalid quantity for product');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should fail with status 404 if product is not found (using mocking)', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };

        // Mock Product.find to return empty array
        const findSpy = jest.spyOn(Product, 'find').mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
            })
        });

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Product not found');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(404);

        findSpy.mockRestore();
    });

    it('should fail if product is not found', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.orderItems[0].product = new mongoose.Types.ObjectId(); // Non-existent ID

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Product not found');
    });

    it('should fail if itemsPrice is not a number (NaN)', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.itemsPrice = "invalid_price"; // Tampered price

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Price mismatch detected. Please refresh and try again.');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should fail on itemsPrice mismatch', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.itemsPrice = 999; // Tampered price

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Price mismatch detected. Please refresh and try again.');
    });

    it('should fail on taxPrice mismatch', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.taxPrice = 999;

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Tax price mismatch detected. Please refresh and try again.');
    });

    it('should fail when taxPrice is NaN', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.taxPrice = 'invalid_number';

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Tax price mismatch detected. Please refresh and try again.');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should fail on shippingPrice mismatch', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.shippingPrice = 999;

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Shipping price mismatch detected. Please refresh and try again.');
    });

    it('should fail if shippingPrice is not a number and verify status 400', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.shippingPrice = "invalid";

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Shipping price mismatch detected. Please refresh and try again.');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });


    it('should fail on totalPrice mismatch', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.totalPrice = 999;

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Total price mismatch detected. Please refresh and try again.');
    });

    it('should fail if paymentInfo lacks an ID', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.paymentInfo = { status: "succeeded" }; // Missing ID

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Payment Information is missing');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should fail if paymentInfo is completely missing', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        delete req.body.paymentInfo;

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Payment Information is missing');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should fail if stripe payment intent status is not succeeded', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };

        mockStripeRetrieve.mockResolvedValueOnce({
            status: "failed",
            amount: 43600
        });

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Payment not verified');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should fail if req paymentInfo.status is not succeeded', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };
        req.body.paymentInfo.status = "failed";

        mockStripeRetrieve.mockResolvedValueOnce({
            status: "succeeded",
            amount: 43600
        });

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Payment status mismatch');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should fail on payment amount mismatch (Stripe amount vs calculated amount)', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };

        mockStripeRetrieve.mockResolvedValueOnce({
            status: "succeeded",
            amount: 99900 // Different amount
        });

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Payment amount mismatch');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should fail on replay attack (paymentInfo.id already used)', async () => {
        const req = {
            body: getValidReqBody(),
            user: testUser
        };

        // Create an existing order with the same payment ID
        await Order.create({
            shippingInfo: validShippingInfo,
            orderItems: [],
            paymentInfo: req.body.paymentInfo,
            itemsPrice: 0,
            taxPrice: 0,
            shippingPrice: 0,
            totalPrice: 0,
            paidAt: Date.now(),
            user: testUser._id
        });

        mockStripeRetrieve.mockResolvedValueOnce({
            status: "succeeded",
            amount: 43600
        });

        await orderController.newOrder(req, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(mockNext.mock.calls[0][0].message).toContain('Payment already used');
        expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
});
