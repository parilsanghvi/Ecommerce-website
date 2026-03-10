const { sendStripeApiKey } = require("../../controllers/paymentController");

// Mock catchAsyncErrors to return function directly
jest.mock("../../middleware/catchAsyncErrors", () => (func) => func);

// Mock Stripe so the controller doesn't fail on require
jest.mock("stripe", () => {
    return jest.fn(() => ({
        paymentIntents: {
            create: jest.fn(),
        },
    }));
});
jest.mock("../../models/productModel");
jest.mock("../../utils/errorhandler");

describe("Payment Controller - sendStripeApiKey", () => {
    let req, res, next;
    const ORIGINAL_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...ORIGINAL_ENV }; // Make a copy

        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV; // Restore original env
    });

    it("should return the Stripe API key from environment variables", async () => {
        process.env.STRIPE_API_KEY = "test_stripe_api_key_123";

        await sendStripeApiKey(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            stripeApiKey: "test_stripe_api_key_123",
        });
    });
});
