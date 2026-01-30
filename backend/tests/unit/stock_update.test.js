const { updateOrder } = require('../../controllers/orderController');
const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');

// Mock catchAsyncErrors to return the promise
jest.mock('../../middleware/catchAsyncErrors', () => (fn) => (req, res, next) => {
    return fn(req, res, next);
});

jest.mock('../../models/orderModel');
jest.mock('../../models/productModel');
jest.mock('../../utlis/errorhandler', () => class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
});

describe('updateOrder Stock Update Unit Test', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 'order_id' },
            body: { status: 'Shipped' },
            user: { _id: 'admin_id' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should decrement product stock using atomic update ($inc)', async () => {
        // Mock Order
        const mockOrder = {
            _id: 'order_id',
            orderStatus: 'Processing',
            orderItems: [
                { product: 'p1', quantity: 2 }
            ],
            save: jest.fn().mockResolvedValue(true)
        };
        Order.findById.mockResolvedValue(mockOrder);

        // Mock Product.updateOne
        Product.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

        await updateOrder(req, res, next);

        expect(Order.findById).toHaveBeenCalledWith('order_id');

        // Verify atomic update
        expect(Product.updateOne).toHaveBeenCalledWith(
            { _id: 'p1' },
            { $inc: { stock: -2 } }
        );

        // Ensure old method is NOT used
        expect(Product.findById).not.toHaveBeenCalledWith('p1');

        expect(res.status).toHaveBeenCalledWith(200);
    });
});
