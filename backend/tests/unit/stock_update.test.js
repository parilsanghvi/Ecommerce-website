const { updateOrder } = require('../../controllers/orderController');
const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const ErrorHandler = require('../../utils/errorhandler');

// Mock middleware
jest.mock('../../middleware/catchAsyncErrors', () => (fn) => fn);

// Mock models
jest.mock('../../models/orderModel');
jest.mock('../../models/productModel');

describe('updateOrder Stock Update Security', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 'order123' },
            body: { status: 'Shipped' },
            user: { _id: 'adminId' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should use bulkWrite for atomic update to improve performance after pre-verifying stock', async () => {
        const mockOrder = {
            orderStatus: 'Processing',
            orderItems: [
                { product: 'prod1', quantity: 2 },
                { product: 'prod2', quantity: 1 }
            ],
            save: jest.fn()
        };

        const mockProducts = [
            { _id: 'prod1', stock: 5 },
            { _id: 'prod2', stock: 3 }
        ];

        Order.findById.mockResolvedValue(mockOrder);
        // Mock Product.find to return sufficient stock for pre-verification
        Product.find.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockProducts)
        });
        // Mock bulkWrite success (modifiedCount matches items length)
        Product.bulkWrite.mockResolvedValue({ modifiedCount: 2 });

        await updateOrder(req, res, next);

        expect(Order.findById).toHaveBeenCalledWith('order123');
        expect(Product.find).toHaveBeenCalledWith({ _id: { $in: ['prod1', 'prod2'] } });
        expect(Product.bulkWrite).toHaveBeenCalledTimes(1);

        const expectedOperations = [
            {
                updateOne: {
                    filter: { _id: 'prod1', stock: { $gte: 2 } },
                    update: { $inc: { stock: -2 } }
                }
            },
            {
                updateOne: {
                    filter: { _id: 'prod2', stock: { $gte: 1 } },
                    update: { $inc: { stock: -1 } }
                }
            }
        ];

        expect(Product.bulkWrite).toHaveBeenCalledWith(expectedOperations);

        expect(mockOrder.orderStatus).toBe('Shipped');
        expect(mockOrder.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('should pass to next with error and NOT call bulkWrite if pre-verification fails due to insufficient stock', async () => {
        const mockOrder = {
            orderStatus: 'Processing',
            orderItems: [
                { product: 'prod1', quantity: 10 }
            ],
            save: jest.fn()
        };

        const mockProducts = [
            { _id: 'prod1', stock: 5 } // Only 5 in stock, but order needs 10
        ];

        Order.findById.mockResolvedValue(mockOrder);
        Product.find.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockProducts)
        });

        await updateOrder(req, res, next);

        // Verify next was called with an ErrorHandler
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toBe('Insufficient stock for one or more products');

        // bulkWrite should not be called at all due to early exit
        expect(Product.bulkWrite).not.toHaveBeenCalled();

        // Verify order was NOT saved
        expect(mockOrder.save).not.toHaveBeenCalled();
        // Verify response was NOT sent
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should throw error and NOT update stock if order is already Shipped', async () => {
        const mockOrder = {
            orderStatus: 'Shipped',
            orderItems: [
                { product: 'prod1', quantity: 2 }
            ],
            save: jest.fn()
        };

        Order.findById.mockResolvedValue(mockOrder);

        await updateOrder(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].message).toBe('Order has already been marked as Shipped');
        expect(next.mock.calls[0][0].statusCode).toBe(400);

        expect(Product.bulkWrite).not.toHaveBeenCalled();
        expect(mockOrder.save).not.toHaveBeenCalled();
    });
});
