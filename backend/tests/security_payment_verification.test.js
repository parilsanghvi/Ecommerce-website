const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utlis/errorhandler');

// Mock dependencies
jest.mock('../models/orderModel');
jest.mock('../models/productModel');
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

// Mock Stripe
jest.mock('stripe', () => {
    return jest.fn().mockReturnValue({
        paymentIntents: {
            retrieve: jest.fn()
        }
    });
});

const stripe = require('stripe');
// Import controller AFTER mocking stripe so it picks up the mock
const orderController = require('../controllers/orderController');

// Capture the mock instance immediately, before any tests run or mocks are cleared
// The controller calls stripe() on load, so results[0] holds the instance used by the controller
const stripeInstance = stripe.mock.results[0].value;
const mockRetrieve = stripeInstance.paymentIntents.retrieve;

describe('Order Security: Payment Verification', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: { _id: 'userid' },
            body: {
                shippingInfo: {},
                orderItems: [{ product: 'productid', quantity: 1, price: 1000 }],
                paymentInfo: {
                    id: 'pi_fake',
                    status: 'succeeded'
                },
                itemsPrice: 1000,
                taxPrice: 180,
                shippingPrice: 200,
                totalPrice: 1380
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();

        Product.find.mockResolvedValue([{
            _id: 'productid',
            price: 1000
        }]);

        Order.create.mockResolvedValue({ _id: 'orderid' });
        // Reset findOne to ensure no leakage between tests
        if (Order.findOne && Order.findOne.mockReset) Order.findOne.mockReset();
    });

    it('should REJECT order creation when actual payment status is invalid', async () => {
        // Mock Stripe to return an invalid payment status
        mockRetrieve.mockResolvedValue({
            id: 'pi_fake',
            status: 'requires_payment_method', // Invalid status
            amount: 138000
        });

        await orderController.newOrder(req, res, next);

        // Expectation: ErrorHandler called
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toMatch(/Payment not verified/);
        expect(Order.create).not.toHaveBeenCalled();
        expect(mockRetrieve).toHaveBeenCalledWith('pi_fake');
    });

    it('should REJECT order creation when payment amount mismatches', async () => {
        // Mock Stripe to return valid status but wrong amount
        mockRetrieve.mockResolvedValue({
            id: 'pi_fake',
            status: 'succeeded',
            amount: 100000 // Mismatch (should be 138000)
        });

        await orderController.newOrder(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toMatch(/Payment amount mismatch/);
        expect(Order.create).not.toHaveBeenCalled();
    });

    it('should REJECT order creation when payment status in body mismatches Stripe status', async () => {
         req.body.paymentInfo.status = 'failed';

         mockRetrieve.mockResolvedValue({
            id: 'pi_fake',
            status: 'succeeded',
            amount: 138000
        });

        await orderController.newOrder(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toMatch(/Payment status mismatch/);
        expect(Order.create).not.toHaveBeenCalled();
    });

    it('should CREATE order when payment is valid and verified', async () => {
        // Mock Stripe to return valid payment
        mockRetrieve.mockResolvedValue({
            id: 'pi_fake',
            status: 'succeeded',
            amount: 138000
        });

        await orderController.newOrder(req, res, next);

        expect(Order.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true
        }));
    });

    it('should REJECT order creation when payment ID is already used (Replay Attack)', async () => {
        // Mock Stripe to return valid payment
        mockRetrieve.mockResolvedValue({
            id: 'pi_fake',
            status: 'succeeded',
            amount: 138000
        });

        // Mock Order.findOne to find an existing order with the same payment ID
        // Note: Order model is mocked, so findOne is a jest.fn()
        // We simulate finding a document
        Order.findOne.mockResolvedValue({ _id: 'existing_order_id' });

        await orderController.newOrder(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toMatch(/Payment already used/);
        expect(Order.create).not.toHaveBeenCalled();
    });
});
