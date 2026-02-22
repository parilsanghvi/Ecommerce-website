const { newOrder } = require('../../controllers/orderController');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');
const ErrorHandler = require('../../utlis/errorhandler');

jest.mock('../../models/productModel');
jest.mock('../../models/orderModel');
jest.mock('../../models/userModel');
// Mock Stripe
jest.mock('stripe', () => {
    return jest.fn(() => ({
        paymentIntents: {
            retrieve: jest.fn().mockResolvedValue({
                status: 'succeeded',
                amount: 79000 // 790 * 100
            }),
        }
    }));
});
// Mock catchAsyncErrors to just pass through the function
jest.mock('../../middleware/catchAsyncErrors', () => (fn) => (req, res, next) => fn(req, res, next));

describe('newOrder optimization', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {
                shippingInfo: {},
                orderItems: [
                    { product: 'prod1', quantity: 2 },
                    { product: 'prod2', quantity: 3 }
                ],
                paymentInfo: { id: 'pi_123', status: 'succeeded' },
                itemsPrice: 500,
                taxPrice: 90,
                shippingPrice: 200,
                totalPrice: 790
            },
            user: { _id: 'user1' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should correctly calculate price using the Map-based lookup', async () => {
        Product.find.mockResolvedValue([
            { _id: 'prod1', price: 100, toString: () => 'prod1' },
            { _id: 'prod2', price: 100, toString: () => 'prod2' }
        ]);

        Order.create.mockResolvedValue({ _id: 'order1', ...req.body });

        await newOrder(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true
        }));
    });

    it('should return 404 if a product in orderItems is not found in the products array', async () => {
        Product.find.mockResolvedValue([
            { _id: 'prod1', price: 100, toString: () => 'prod1' }
            // prod2 is missing
        ]);

        await newOrder(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('Product not found: prod2');
    });

    it('should handle ObjectId-like strings correctly', async () => {
         Product.find.mockResolvedValue([
            { _id: { toString: () => 'prod1' }, price: 100 },
            { _id: { toString: () => 'prod2' }, price: 100 }
        ]);

        Order.create.mockResolvedValue({ _id: 'order1', ...req.body });

        await newOrder(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
