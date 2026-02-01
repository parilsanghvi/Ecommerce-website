const { updateOrder } = require('../../controllers/orderController');
const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');

jest.mock('../../models/orderModel');
jest.mock('../../models/productModel');
jest.mock('../../middleware/catchAsyncErrors', () => (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
});

describe('updateOrder Controller Stock Update', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 'orderId' },
            body: { status: 'Shipped' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should update stock using updateOne with $inc (optimized implementation)', async () => {
        const mockOrder = {
            _id: 'orderId',
            orderStatus: 'Processing',
            orderItems: [
                { product: 'prod1', quantity: 2 }
            ],
            save: jest.fn(),
            deliveredAt: null
        };

        Order.findById.mockResolvedValue(mockOrder);

        // Mock Product.updateOne
        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

        await updateOrder(req, res, next);

        expect(Order.findById).toHaveBeenCalledWith('orderId');

        // Expect Product.updateOne to have been called instead of findById/save
        expect(Product.updateOne).toHaveBeenCalledWith(
            { _id: 'prod1' },
            { $inc: { stock: -2 } }
        );

        // Verify findById was NOT called for product (since we optimized it away)
        expect(Product.findById).not.toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });
});
