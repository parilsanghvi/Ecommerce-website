jest.mock("../models/productModel");
const Product = require("../models/productModel");

// Mock the middleware BEFORE requiring the controllers
jest.mock("../middleware/catchAsyncErrors", () => (func) => (req, res, next) => Promise.resolve(func(req, res, next)).catch(next));

// Also need to mock other models and dependencies
jest.mock("../models/orderModel");
jest.mock("../models/userModel");
jest.mock("../utils/errorhandler");
jest.mock("stripe", () => () => ({
    paymentIntents: {
        retrieve: jest.fn().mockResolvedValue({ status: "succeeded", amount: 100000 }),
        create: jest.fn().mockResolvedValue({ client_secret: "secret" })
    }
}));

const { newOrder } = require("../controllers/orderController");
const { processPayment } = require("../controllers/paymentController");

describe("Optimization Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should optimize product lookup in newOrder", async () => {
        const req = {
            body: {
                orderItems: [{ product: "123", quantity: 1 }],
                itemsPrice: 100,
                taxPrice: 18,
                shippingPrice: 200,
                totalPrice: 318,
                paymentInfo: { id: "pi_123", status: "succeeded" }
            },
            user: { _id: "user123" }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        Product.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ _id: "123", price: 100 }])
            })
        });

        await newOrder(req, res, next);
        expect(Product.find).toHaveBeenCalledWith({ _id: { $in: ["123"] } });
        expect(Product.find().select).toHaveBeenCalledWith('price');
        expect(Product.find().select().lean).toHaveBeenCalled();
    });

    it("should optimize product lookup in processPayment", async () => {
        const req = { body: { items: [{ product: "123", quantity: 1 }] } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        Product.find.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ _id: "123", price: 100 }])
            })
        });

        await processPayment(req, res, next);
        expect(Product.find).toHaveBeenCalledWith({ _id: { $in: ["123"] } });
        expect(Product.find().select).toHaveBeenCalledWith('price');
        expect(Product.find().select().lean).toHaveBeenCalled();
    });
});
