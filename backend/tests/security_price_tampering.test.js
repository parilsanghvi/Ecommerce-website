const orderController = require('../controllers/orderController');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/errorhandler');

// Mock Mongoose Models
jest.mock('../models/productModel');
jest.mock('../models/orderModel');
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

// Mock Stripe
jest.mock('stripe', () => {
    return jest.fn(() => ({
        paymentIntents: {
            retrieve: jest.fn().mockResolvedValue({
                status: 'succeeded',
                amount: 138000 // 1380 * 100
            })
        }
    }));
});

describe('Order Security: Price Tampering', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject order creation when price is tampered', async () => {
        // Mock request data
        const req = {
            user: { _id: 'userid', name: 'Test User', email: 'test@example.com' },
            body: {
                shippingInfo: {},
                orderItems: [{
                    product: '507f1f77bcf86cd799439011',
                    quantity: 1,
                    price: 1 // User claims price is 1
                }],
                paymentInfo: { id: 'pi_test', status: 'succeeded' },
                itemsPrice: 1, // User claims total items price is 1
                taxPrice: 0,
                shippingPrice: 0,
                totalPrice: 1
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        // Mock Product.find to return the REAL product with price 1000
        Product.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{
                    _id: '507f1f77bcf86cd799439011',
                    price: 1000,
                }])
            })
        });

        await orderController.newOrder(req, res, next);

        // Verify that Order.create was NOT called
        expect(Order.create).not.toHaveBeenCalled();

        // Verify that next was called with an error (Price mismatch)
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toMatch(/Price mismatch detected/);
    });

    it('should create order when price is valid', async () => {
        // Mock request data
        const req = {
            user: { _id: 'userid', name: 'Test User', email: 'test@example.com' },
            body: {
                shippingInfo: {},
                orderItems: [{
                    product: '507f1f77bcf86cd799439011',
                    quantity: 1,
                    price: 1000
                }],
                paymentInfo: { id: 'pi_test', status: 'succeeded' },
                itemsPrice: 1000, // Valid Total
                taxPrice: 180, // 1000 * 0.18
                shippingPrice: 200, // 1000 is not > 1000, so shipping is 200
                totalPrice: 1380 // 1000 + 180 + 200
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        // Mock Product.find to return the REAL product with price 1000
        Product.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{
                    _id: '507f1f77bcf86cd799439011',
                    price: 1000,
                }])
            })
        });

        // Mock Replay Attack check (Order not found)
        Order.findOne.mockResolvedValue(null);

        // Mock Order.create success
        Order.create.mockResolvedValue({
            ...req.body,
            _id: 'orderid'
        });

        await orderController.newOrder(req, res, next);

        // Verify that Order.create WAS called
        expect(Order.create).toHaveBeenCalledWith(expect.objectContaining({
            itemsPrice: 1000
        }));

        // Verify success response
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
