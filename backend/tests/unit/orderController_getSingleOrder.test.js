const Order = require("../../models/orderModel");
const User = require("../../models/userModel");
const ErrorHandler = require("../../utils/errorhandler");

// Mock catchAsyncErrors before requiring the controller
jest.mock("../../middleware/catchAsyncErrors", () => (func) => (req, res, next) => {
  return Promise.resolve(func(req, res, next)).catch(next);
});

// Mock Order and User models
jest.mock("../../models/orderModel");
jest.mock("../../models/userModel", () => ({}), { virtual: true });
jest.mock("../../models/productModel", () => ({}), { virtual: true });

const { getSingleOrder } = require("../../controllers/orderController");

describe("getSingleOrder Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: "orderId123" },
      user: { _id: "userA_ID", role: "user", name: "User A", email: "usera@example.com" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should fail (404) when order is not found", async () => {
    // Mock Order.findById to return null via lean()
    const mockLean = jest.fn().mockResolvedValue(null);
    Order.findById.mockReturnValue({ lean: mockLean });

    await getSingleOrder(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith("orderId123");
    expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(next.mock.calls[0][0].statusCode).toBe(404);
    expect(next.mock.calls[0][0].message).toBe("order not found with this id");
  });


  it("should fail (404) when user accesses another user's order and is not admin", async () => {
    // Setup request with user different from order owner and not admin
    req.user._id = "userB_ID";
    req.user.role = "user";

    const mockOrder = {
      _id: "orderId123",
      user: "userA_ID", // Different user
      totalPrice: 100,
    };

    const mockLean = jest.fn().mockResolvedValue(mockOrder);
    Order.findById.mockReturnValue({ lean: mockLean });

    await getSingleOrder(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith("orderId123");
    expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(next.mock.calls[0][0].statusCode).toBe(404);
    expect(next.mock.calls[0][0].message).toBe("order not found with this id");
  });

  it("should pass errors from DB to next", async () => {
    const dbError = new Error("Database error");
    const mockLean = jest.fn().mockRejectedValue(dbError);
    Order.findById.mockReturnValue({ lean: mockLean });

    await getSingleOrder(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith("orderId123");
    expect(next).toHaveBeenCalledWith(dbError);
  });

  it("should successfully retrieve an order", async () => {
    const mockOrder = {
      _id: "orderId123",
      user: "userA_ID",
      totalPrice: 100,
    };

    const mockLean = jest.fn().mockResolvedValue(mockOrder);
    Order.findById.mockReturnValue({ lean: mockLean });

    await getSingleOrder(req, res, next);

    expect(Order.findById).toHaveBeenCalledWith("orderId123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      order: {
        _id: "orderId123",
        user: {
          _id: "userA_ID",
          name: "User A",
          email: "usera@example.com",
        },
        totalPrice: 100,
      },
    });
  });
});
