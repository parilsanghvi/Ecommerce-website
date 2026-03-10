// Mock the catchAsyncErrors middleware to simply call the async function and catch any errors, passing them to next
jest.mock("../../middleware/catchAsyncErrors", () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

// Mock models and dependencies before importing the controller
jest.mock("../../models/orderModel", () => ({
    findById: jest.fn()
}), { virtual: true });
jest.mock("../../models/userModel", () => ({}), { virtual: true });
jest.mock("../../models/productModel", () => ({}), { virtual: true });
jest.mock("stripe", () => () => ({
    paymentIntents: {
        retrieve: jest.fn()
    }
}), { virtual: true });

const Order = require("../../models/orderModel");
const ErrorHandler = require("../../utils/errorhandler");
const { deleteOrder } = require("../../controllers/orderController");

describe("deleteOrder Controller", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: {
                id: "testOrderId123"
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should successfully delete an order and return 200", async () => {
        const mockOrder = {
            _id: "testOrderId123",
            deleteOne: jest.fn().mockResolvedValue(true)
        };

        Order.findById.mockResolvedValue(mockOrder);

        await deleteOrder(req, res, next);

        expect(Order.findById).toHaveBeenCalledWith("testOrderId123");
        expect(mockOrder.deleteOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should call next with 404 ErrorHandler if order is not found", async () => {
        Order.findById.mockResolvedValue(null);

        await deleteOrder(req, res, next);

        expect(Order.findById).toHaveBeenCalledWith("testOrderId123");
        expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
        expect(next.mock.calls[0][0].statusCode).toBe(404);
        expect(next.mock.calls[0][0].message).toBe("order not found with this id");
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it("should call next with error if Order.findById throws an error", async () => {
        const dbError = new Error("Database connection failed");
        Order.findById.mockRejectedValue(dbError);

        await deleteOrder(req, res, next);

        expect(Order.findById).toHaveBeenCalledWith("testOrderId123");
        expect(next).toHaveBeenCalledWith(dbError);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it("should call next with error if order.deleteOne throws an error", async () => {
        const deleteError = new Error("Failed to delete document");
        const mockOrder = {
            _id: "testOrderId123",
            deleteOne: jest.fn().mockRejectedValue(deleteError)
        };

        Order.findById.mockResolvedValue(mockOrder);

        await deleteOrder(req, res, next);

        expect(Order.findById).toHaveBeenCalledWith("testOrderId123");
        expect(mockOrder.deleteOne).toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(deleteError);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
