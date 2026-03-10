// Mock external dependencies before anything is imported
jest.mock("mongoose", () => {
    return {
        Schema: jest.fn().mockImplementation(() => ({
            pre: jest.fn(),
            methods: {},
            index: jest.fn(),
            virtual: jest.fn(),
            set: jest.fn()
        })),
        model: jest.fn()
    };
}, { virtual: true });

jest.mock("bcryptjs", () => ({}), { virtual: true });
jest.mock("jsonwebtoken", () => ({}), { virtual: true });
jest.mock("validator", () => ({
    isEmail: jest.fn()
}), { virtual: true });

jest.mock("stripe", () => {
    return jest.fn().mockImplementation(() => ({
        paymentIntents: {
            retrieve: jest.fn()
        }
    }));
}, { virtual: true });

// Mock calculateOrderPrices
jest.mock("../../utils/pricing", () => ({
  calculateOrderPrices: jest.fn()
}));

// Mock catchAsyncErrors to allow awaiting the controller function directly
jest.mock("../../middleware/catchAsyncErrors", () => (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
});


const { getPricing } = require("../../controllers/orderController");
const { calculateOrderPrices } = require("../../utils/pricing");
const ErrorHandler = require("../../utils/errorhandler");


describe("Order Controller - getPricing", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it("should return 400 ErrorHandler when itemsPrice is not provided", async () => {
    await getPricing(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ErrorHandler);
    expect(next.mock.calls[0][0].message).toBe("Please provide itemsPrice");
    expect(next.mock.calls[0][0].statusCode).toBe(400);

    expect(calculateOrderPrices).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return pricing details successfully when itemsPrice is provided", async () => {
    req.query.itemsPrice = "1000";

    // Setup mock return value
    const mockPrices = {
        taxPrice: 180,
        shippingPrice: 200,
        totalPrice: 1380
    };
    calculateOrderPrices.mockReturnValue(mockPrices);

    await getPricing(req, res, next);

    expect(calculateOrderPrices).toHaveBeenCalledTimes(1);
    expect(calculateOrderPrices).toHaveBeenCalledWith("1000");

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
        success: true,
        ...mockPrices
    });

    expect(next).not.toHaveBeenCalled();
  });
});
