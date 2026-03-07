const paymentController = require("../controllers/paymentController");
const Product = require("../models/productModel");
const stripe = require("stripe");

// Mock catchAsyncErrors to allow awaiting the controller
jest.mock("../middleware/catchAsyncErrors", () => (func) => func);

// Mock dependencies
jest.mock("../models/productModel");
jest.mock("stripe", () => {
  const mStripe = {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: "secret" }),
    },
  };
  return jest.fn(() => mStripe);
});

describe("Payment Controller Security Fix", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        items: [
          { product: "prod1", quantity: 2 },
          { product: "prod2", quantity: 1 },
        ],
        amount: 100, // Malicious amount
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    Product.find.mockReset();
    stripe().paymentIntents.create.mockClear();
  });

  it("should calculate price on server and ignore client amount", async () => {
    // Mock products
    const mockProducts = [
      { _id: "prod1", price: 500, toString: () => "prod1" },
      { _id: "prod2", price: 1000, toString: () => "prod2" },
    ];
    // Find returns a promise that resolves to array
    Product.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockProducts)
        })
    });

    await paymentController.processPayment(req, res, next);

    // Calculation:
    // Item 1: 500 * 2 = 1000
    // Item 2: 1000 * 1 = 1000
    // Subtotal = 2000
    // Shipping: 2000 > 1000 ? 0 : 200 = 0
    // Tax: 2000 * 0.18 = 360
    // Total: 2000 + 0 + 360 = 2360
    // Amount in paise: 2360 * 100 = 236000

    const stripeInstance = stripe();
    expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 236000,
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, client_secret: "secret" });
  });

  it("should handle shipping charges correctly (subtotal <= 1000)", async () => {
    req.body.items = [{ product: "prod1", quantity: 1 }];
    const mockProducts = [{ _id: "prod1", price: 500, toString: () => "prod1" }];
    Product.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockProducts)
        })
    });

    await paymentController.processPayment(req, res, next);

    // Subtotal: 500
    // Shipping: 200
    // Tax: 500 * 0.18 = 90
    // Total: 500 + 200 + 90 = 790
    // Amount: 79000

    const stripeInstance = stripe();
    expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 79000,
      })
    );
  });

  it("should return error if items are missing", async () => {
    req.body = {};
    await paymentController.processPayment(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should return error if product not found", async () => {
    const mockProducts = [{ _id: "prod1", price: 500, toString: () => "prod1" }];
    Product.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockProducts)
        })
    }); // Only prod1 found

    // req has prod1 and prod2
    await paymentController.processPayment(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
