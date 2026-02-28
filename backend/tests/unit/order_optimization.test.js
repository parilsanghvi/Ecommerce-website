const Order = require("../../models/orderModel");
const User = require("../../models/userModel");
const ErrorHandler = require("../../utils/errorhandler");

// Mock catchAsyncErrors before requiring the controller
jest.mock("../../middleware/catchAsyncErrors", () => (func) => (req, res, next) => {
  return Promise.resolve(func(req, res, next)).catch(next);
});

// Mock models
jest.mock("../../models/orderModel");
jest.mock("../../models/userModel");

const { getSingleOrder } = require("../../controllers/orderController");

describe("getSingleOrder Optimization", () => {
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

  it("should NOT call populate and use req.user details when user accesses their own order", async () => {
    // Mock order belonging to User A (req.user)
    const mockOrder = {
      _id: "orderId123",
      user: "userA_ID", // Returns just the ID because populate is removed
      totalPrice: 100,
    };

    // Chainable Mongoose mocks: findById -> lean -> returns mockOrder
    // IMPORTANT: Verify that 'populate' is NOT part of the chain
    const mockLean = jest.fn().mockResolvedValue(mockOrder);
    // const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean }); // Removed

    // If populate WAS called, this mock structure would fail or be skipped
    // We mock findById to return an object with ONLY lean, not populate
    Order.findById.mockReturnValue({ lean: mockLean });

    await getSingleOrder(req, res, next);

    // Verify findById called
    expect(Order.findById).toHaveBeenCalledWith("orderId123");

    // Verify populate was NOT called (implied by the mock structure, but let's be explicit if we could spy)
    // Since our mock object doesn't have populate, if the code called .populate(), it would crash with "undefined is not a function"
    // So if the test passes, populate was NOT called.

    // Verify response structure
    expect(res.status).toHaveBeenCalledWith(200);
    const responseOrder = res.json.mock.calls[0][0].order;

    // Check that user details were attached correctly
    expect(responseOrder.user).toEqual({
      _id: "userA_ID",
      name: "User A",
      email: "usera@example.com"
    });
  });

  it("should call User.findById when admin accesses another user's order", async () => {
    req.user = { _id: "adminID", role: "admin", name: "Admin", email: "admin@example.com" };

    const mockOrder = {
      _id: "orderId123",
      user: "userB_ID", // Belongs to User B
      totalPrice: 200,
    };

    const mockUserB = {
      _id: "userB_ID",
      name: "User B",
      email: "userb@example.com"
    };

    // Mock Order.findById -> lean
    const mockOrderLean = jest.fn().mockResolvedValue(mockOrder);
    Order.findById.mockReturnValue({ lean: mockOrderLean });

    // Mock User.findById -> select -> lean
    const mockUserLean = jest.fn().mockResolvedValue(mockUserB);
    const mockSelect = jest.fn().mockReturnValue({ lean: mockUserLean });
    User.findById.mockReturnValue({ select: mockSelect });

    await getSingleOrder(req, res, next);

    // Verify User.findById called with the order's user ID
    expect(User.findById).toHaveBeenCalledWith("userB_ID");
    expect(mockSelect).toHaveBeenCalledWith("name email");

    // Verify response structure
    expect(res.status).toHaveBeenCalledWith(200);
    const responseOrder = res.json.mock.calls[0][0].order;

    // Check that user details were attached from the DB fetch
    expect(responseOrder.user).toEqual(mockUserB);
  });
});
