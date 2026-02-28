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

    it('should use bulkWrite for atomic update to improve performance', async () => {
        const mockOrder = {
            orderStatus: 'Processing',
            orderItems: [
                { product: 'prod1', quantity: 2 },
                { product: 'prod2', quantity: 1 }
            ],
            save: jest.fn()
        };

        Order.findById.mockResolvedValue(mockOrder);
        // Mock bulkWrite success (modifiedCount matches items length)
        Product.bulkWrite.mockResolvedValue({ modifiedCount: 2 });

        await updateOrder(req, res, next);

        expect(Order.findById).toHaveBeenCalledWith('order123');
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
    });

    it('should throw error and NOT update order status if stock is insufficient', async () => {
        const mockOrder = {
            orderStatus: 'Processing',
            orderItems: [
                { product: 'prod1', quantity: 10 }
            ],
            save: jest.fn()
        };

        Order.findById.mockResolvedValue(mockOrder);
        // Simulate failure (modifiedCount: 0, mismatch with operations.length 1)
        Product.bulkWrite.mockResolvedValue({ modifiedCount: 0 });

        await expect(updateOrder(req, res, next)).rejects.toThrow('Insufficient stock for one or more products');

        expect(Product.bulkWrite).toHaveBeenCalledWith([
            {
                updateOne: {
                    filter: { _id: 'prod1', stock: { $gte: 10 } },
                    update: { $inc: { stock: -10 } }
                }
            }
        ]);

        // Verify order was NOT saved
        expect(mockOrder.save).not.toHaveBeenCalled();
        // Verify response was NOT sent
        expect(res.status).not.toHaveBeenCalled();
    });
});
