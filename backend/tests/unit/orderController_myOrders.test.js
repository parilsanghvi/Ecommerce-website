// Mock catchAsyncErrors to allow awaiting the controller function and catching errors
jest.mock("../../middleware/catchAsyncErrors", () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

// Mock models and dependencies before importing the controller
jest.mock("../../models/orderModel");
jest.mock("../../models/userModel", () => ({}), { virtual: true });
jest.mock("../../models/productModel", () => ({}), { virtual: true });

const Order = require("../../models/orderModel");
const { myOrders } = require("../../controllers/orderController");

describe("myOrders Controller", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: {
                _id: "testUserId123"
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should return logged in user orders successfully", async () => {
        const mockOrders = [
            { _id: "order1", itemsPrice: 100 },
            { _id: "order2", itemsPrice: 200 }
        ];

        // Mock the Mongoose chain: find().select().lean()
        const mockLean = jest.fn().mockResolvedValue(mockOrders);
        const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });
        Order.find.mockReturnValue({ select: mockSelect });

        await myOrders(req, res, next);

        expect(Order.find).toHaveBeenCalledWith({ user: "testUserId123" });
        expect(mockSelect).toHaveBeenCalledWith("-shippingInfo -paymentInfo -user");
        expect(mockLean).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            orders: mockOrders
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if database query fails", async () => {
        const dbError = new Error("Database error");

        const mockLean = jest.fn().mockRejectedValue(dbError);
        const mockSelect = jest.fn().mockReturnValue({ lean: mockLean });
        Order.find.mockReturnValue({ select: mockSelect });

        await myOrders(req, res, next);

        expect(Order.find).toHaveBeenCalledWith({ user: "testUserId123" });
        expect(next).toHaveBeenCalledWith(dbError);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
