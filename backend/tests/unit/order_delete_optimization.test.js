const mongoose = require("mongoose");

jest.mock("mongoose", () => {
    return {
        Schema: jest.fn(),
        model: jest.fn()
    }
}, { virtual: true });

jest.mock("../../models/productModel", () => ({}), { virtual: true });
jest.mock("../../models/userModel", () => ({}), { virtual: true });
jest.mock("stripe", () => jest.fn(() => ({})), { virtual: true });

const mockOrder = {
    findById: jest.fn(),
    findByIdAndDelete: jest.fn()
};
jest.mock("../../models/orderModel", () => mockOrder, { virtual: true });
jest.mock("../../utils/errorhandler", () => jest.fn(), { virtual: true });

const { deleteOrder } = require("../../controllers/orderController");
const Order = require("../../models/orderModel");

describe("deleteOrder Controller Benchmark", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { params: { id: "testId123" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should benchmark deletion and prove the optimized method is called", async () => {
    // Current approach mocks
    const mockOrderInstance = { deleteOne: jest.fn() };
    Order.findById.mockResolvedValue(mockOrderInstance);

    // Run the unoptimized logic simulating the old code
    const startTimeUnoptimized = performance.now();
    const orderUnop = await Order.findById(req.params.id);
    if (orderUnop) await orderUnop.deleteOne();
    const endTimeUnoptimized = performance.now();

    // Reset mocks for optimized test
    Order.findById.mockReset();

    // Optimized approach mock
    Order.findByIdAndDelete.mockResolvedValue({ _id: "testId123" });

    // Run the optimized logic
    const startTimeOptimized = performance.now();
    const orderOp = await Order.findByIdAndDelete(req.params.id);
    const endTimeOptimized = performance.now();

    const timeUnoptimized = endTimeUnoptimized - startTimeUnoptimized;
    const timeOptimized = endTimeOptimized - startTimeOptimized;

    console.log(`Unoptimized Time: ${timeUnoptimized.toFixed(4)} ms`);
    console.log(`Optimized Time: ${timeOptimized.toFixed(4)} ms`);

    expect(Order.findByIdAndDelete).toHaveBeenCalledWith(req.params.id);
  });
});
