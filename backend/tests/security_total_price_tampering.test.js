const orderController = require('../controllers/orderController');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const ErrorHandler = require('../utils/errorhandler');

// Mock Mongoose Models
jest.mock('../models/productModel');
jest.mock('../models/orderModel');
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

describe('Order Security: Total Price Tampering', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject order creation when taxPrice is tampered', async () => {
        const itemsPrice = 1000;
        const correctTax = itemsPrice * 0.18; // 180
        const tamperedTax = 0;

        const req = {
            user: { _id: 'userid', name: 'Test User', email: 'test@example.com' },
            body: {
                shippingInfo: {},
                orderItems: [{
                    product: 'productid',
                    quantity: 1,
                    price: itemsPrice
                }],
                paymentInfo: {},
                itemsPrice: itemsPrice,
                taxPrice: tamperedTax, // Tampered
                shippingPrice: 200, // assume correct
                totalPrice: itemsPrice + tamperedTax + 200 // Consistent with tampered values
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        Product.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{
                    _id: 'productid',
                    price: itemsPrice,
                }])
            })
        });

        await orderController.newOrder(req, res, next);

        // Expectation: Should fail validation
        // But currently it will pass, so Order.create will be called.
        // I will assert that next is called with error to prove it fails (initially this test will FAIL, proving vulnerability)
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toMatch(/Tax price mismatch/);
    });

    it('should reject order creation when shippingPrice is tampered', async () => {
        const itemsPrice = 500; // < 1000, so shipping should be 200
        const correctShipping = 200;
        const tamperedShipping = 0;

        const req = {
            user: { _id: 'userid', name: 'Test User', email: 'test@example.com' },
            body: {
                shippingInfo: {},
                orderItems: [{
                    product: 'productid',
                    quantity: 1,
                    price: itemsPrice
                }],
                paymentInfo: {},
                itemsPrice: itemsPrice,
                taxPrice: itemsPrice * 0.18,
                shippingPrice: tamperedShipping, // Tampered
                totalPrice: itemsPrice + (itemsPrice * 0.18) + tamperedShipping
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        Product.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{
                    _id: 'productid',
                    price: itemsPrice,
                }])
            })
        });

        await orderController.newOrder(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toMatch(/Shipping price mismatch/);
    });

    it('should reject order creation when totalPrice is tampered', async () => {
        const itemsPrice = 1000;
        const taxPrice = 180;
        const shippingPrice = 200;
        const correctTotal = 1380;
        const tamperedTotal = 1000;

        const req = {
            user: { _id: 'userid', name: 'Test User', email: 'test@example.com' },
            body: {
                shippingInfo: {},
                orderItems: [{
                    product: 'productid',
                    quantity: 1,
                    price: itemsPrice
                }],
                paymentInfo: {},
                itemsPrice: itemsPrice,
                taxPrice: taxPrice,
                shippingPrice: shippingPrice,
                totalPrice: tamperedTotal // Tampered
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        Product.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{
                    _id: 'productid',
                    price: itemsPrice,
                }])
            })
        });

        await orderController.newOrder(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toMatch(/Total price mismatch/);
    });
});
