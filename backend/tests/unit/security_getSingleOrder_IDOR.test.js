const Order = require("../../models/orderModel");
const User = require("../../models/userModel");
const ErrorHandler = require("../../utils/errorhandler");

// Mock catchAsyncErrors before requiring the controller
jest.mock("../../middleware/catchAsyncErrors", () => (func) => (req, res, next) => {
  return Promise.resolve(func(req, res, next)).catch(next);
});

// Mock Order and User models
jest.mock("../../models/orderModel");
jest.mock("../../models/userModel");

const { getSingleOrder } = require("../../controllers/orderController");

describe("getSingleOrder Security (IDOR)", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: "orderId123" },
      user: { _id: "userB_ID", role: "user", name: "User B", email: "userb@example.com" }, // Default to User B
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should fail (404) when user accesses another user's order", async () => {
    // Mock order belonging to User A.
    // Since populate is removed, user field is just the ID.
    const mockOrder = {
      _id: "orderId123",
      user: { _id: "userA_ID", name: "User A", email: "usera@example.com" },
    };

    // Chainable Mongoose mocks: findById -> lean -> returns mockOrder
    const mockLean = jest.fn().mockResolvedValue(mockOrder);
    // Removed populate mock
    Order.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: mockLean }) });

    await getSingleOrder(req, res, next);

    // Expectation: Should fail because req.user._id (User B) != order.user (User A)
    expect(next).toHaveBeenCalledWith(expect.any(ErrorHandler));
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it("should succeed when user accesses their own order", async () => {
    req.user._id = "userA_ID"; // Same as order owner
    req.user.name = "User A";
    req.user.email = "usera@example.com";

    const mockOrder = {
      _id: "orderId123",
      user: { _id: "userA_ID", name: "User A", email: "usera@example.com" }, // ID only
    };

    const mockLean = jest.fn().mockResolvedValue(mockOrder);
    Order.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: mockLean }) });

    await getSingleOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    // Verify that the response includes the attached user details
    const responseOrder = res.json.mock.calls[0][0].order;
    expect(responseOrder).toEqual(expect.objectContaining({
        _id: "orderId123",
        user: {
            _id: "userA_ID",
            name: "User A",
            email: "usera@example.com"
        }
    }));
  });

  it("should succeed when admin accesses another user's order", async () => {
    req.user = { _id: "adminID", role: "admin" }; // Admin user

    const mockOrder = {
      _id: "orderId123",
      user: { _id: "userA_ID", name: "User A", email: "usera@example.com" },
    };

    const mockUserA = {
        _id: "userA_ID",
        name: "User A",
        email: "usera@example.com"
    };

    const mockLean = jest.fn().mockResolvedValue(mockOrder);
    Order.findById.mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: mockLean }) });

    // Mock User.findById for admin case
    const mockUserLean = jest.fn().mockResolvedValue(mockUserA);


    await getSingleOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    const responseOrder = res.json.mock.calls[0][0].order;
    expect(responseOrder).toEqual(expect.objectContaining({
        _id: "orderId123",
        user: mockUserA
    }));


  });
});
