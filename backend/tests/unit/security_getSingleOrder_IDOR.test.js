const Order = require("../../models/orderModel");
const ErrorHandler = require("../../utlis/errorhandler");

// Mock catchAsyncErrors before requiring the controller
jest.mock("../../middleware/catchAsyncErrors", () => (func) => (req, res, next) => {
  return Promise.resolve(func(req, res, next)).catch(next);
});

// Mock Order model
jest.mock("../../models/orderModel");

// Mock cloudinary to avoid import errors in productController (even though we test orderController,
// if orderController imports anything that imports cloudinary indirectly)
// orderController imports Product model, which might be fine.
// But let's check orderController imports.
// It imports Product model.
// It imports apifeatures.
// It imports errorhandler.

// If we need to mock other dependencies, we should.
// But let's try with minimal mocks first.

const { getSingleOrder } = require("../../controllers/orderController");

describe("getSingleOrder Security (IDOR)", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: "orderId123" },
      user: { _id: "userB_ID", role: "user" }, // Default to User B
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should fail (404) when user accesses another user's order", async () => {
    // Mock order belonging to User A
    const mockOrder = {
      _id: "orderId123",
      user: { _id: "userA_ID", name: "User A", email: "usera@example.com" },
    };

    // Chainable Mongoose mocks: findById -> populate -> lean -> returns mockOrder
    const mockLean = jest.fn().mockResolvedValue(mockOrder);
    const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
    Order.findById.mockReturnValue({ populate: mockPopulate });

    await getSingleOrder(req, res, next);

    // Expectation: Should fail because req.user._id (User B) != order.user._id (User A)
    // Currently (before fix), this will FAIL the test because it returns 200.
    // We assert that it SHOULD be unauthorized (404).
    expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it("should succeed when user accesses their own order", async () => {
    req.user._id = "userA_ID"; // Same as order owner

    const mockOrder = {
      _id: "orderId123",
      user: { _id: "userA_ID", name: "User A", email: "usera@example.com" },
    };

    const mockLean = jest.fn().mockResolvedValue(mockOrder);
    const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
    Order.findById.mockReturnValue({ populate: mockPopulate });

    await getSingleOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      order: mockOrder,
    });
  });

  it("should succeed when admin accesses another user's order", async () => {
    req.user = { _id: "adminID", role: "admin" }; // Admin user

    const mockOrder = {
      _id: "orderId123",
      user: { _id: "userA_ID", name: "User A", email: "usera@example.com" },
    };

    const mockLean = jest.fn().mockResolvedValue(mockOrder);
    const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean });
    Order.findById.mockReturnValue({ populate: mockPopulate });

    await getSingleOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      order: mockOrder,
    });
  });
});
