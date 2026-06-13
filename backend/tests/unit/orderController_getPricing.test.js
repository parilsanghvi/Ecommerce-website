// Mock models and dependencies before requiring the controller
jest.mock("../../models/orderModel", () => ({}), { virtual: true });
jest.mock("../../models/userModel", () => ({}), { virtual: true });
jest.mock("../../models/productModel", () => ({}), { virtual: true });
jest.mock("stripe", () => () => ({}), { virtual: true });

jest.mock("../../middleware/catchAsyncErrors", () => (func) => (req, res, next) => {
  return Promise.resolve(func(req, res, next)).catch(next);
});

jest.mock("../../utils/pricing", () => ({
  calculateOrderPrices: jest.fn(),
}));

const { getPricing } = require("../../controllers/orderController");
const ErrorHandler = require("../../utils/errorhandler");
const { calculateOrderPrices } = require("../../utils/pricing");

describe("getPricing Unit Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should throw an error if itemsPrice is not provided", async () => {
    await getPricing(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const errorArg = next.mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(ErrorHandler);
    expect(errorArg.statusCode).toBe(400);
    expect(errorArg.message).toBe("Please provide itemsPrice");
  });

  it("should throw an error if itemsPrice is invalid or calculateOrderPrices throws an error", async () => {
    req.query.itemsPrice = "invalid";

    // We expect calculateOrderPrices to throw or return NaN, let's just mock it to throw for this test branch
    const errorMessage = "Invalid itemsPrice format";
    calculateOrderPrices.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await getPricing(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const errorArg = next.mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(Error);
    expect(errorArg.message).toBe(errorMessage);
  });

  it("should calculate order prices and return them successfully", async () => {
    req.query.itemsPrice = "1000";

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
