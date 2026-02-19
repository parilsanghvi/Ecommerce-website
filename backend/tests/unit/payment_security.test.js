const Product = require("../../models/productModel");
const ErrorHandler = require("../../utlis/errorhandler");

// Mock dependencies
jest.mock("../../models/productModel");
jest.mock("../../utlis/errorhandler", () => {
    return class ErrorHandler extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    };
});

// Mock catchAsyncErrors to return function directly
jest.mock("../../middleware/catchAsyncErrors", () => (func) => func);

// Mock Stripe with accessible spy
jest.mock("stripe", () => {
    const create = jest.fn();
    const stripe = jest.fn(() => ({
        paymentIntents: {
            create: create,
        },
    }));
    // Expose the spy on the mock itself
    stripe.createMock = create;
    return stripe;
});

const stripe = require("stripe");
const { processPayment } = require("../../controllers/paymentController");

describe("Payment Security - processPayment", () => {
    let req, res, next;
    const createMock = stripe.createMock;

    beforeEach(() => {
        req = {
            body: {
                items: [],
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();

        jest.clearAllMocks();
    });

    it("should calculate amount server-side and ignore client-provided amount", async () => {
        // Arrange
        const mockItems = [
            { product: "prod1", quantity: 2 },
            { product: "prod2", quantity: 1 },
        ];
        req.body.items = mockItems;
        req.body.amount = 1; // malicious amount

        const mockProducts = [
            { _id: "prod1", price: 500 },
            { _id: "prod2", price: 1000 },
        ];

        Product.find.mockResolvedValue(mockProducts);
        createMock.mockResolvedValue({
            client_secret: "secret_123",
        });

        // Act
        await processPayment(req, res, next);

        // Assert
        expect(Product.find).toHaveBeenCalledWith({
            _id: { $in: ["prod1", "prod2"] },
        });

        expect(createMock).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 236000,
                currency: "inr",
            })
        );

        expect(createMock).not.toHaveBeenCalledWith(
             expect.objectContaining({
                 amount: 1
             })
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            client_secret: "secret_123",
        });
    });

    it("should return error if items are missing", async () => {
        req.body.items = [];
        await processPayment(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toBe("No items provided for payment");
    });

    it("should return error if product not found", async () => {
        const mockItems = [
            { product: "prod1", quantity: 1 },
        ];
        req.body.items = mockItems;

        Product.find.mockResolvedValue([]); // No products found

        await processPayment(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain("Product not found");
    });
});
