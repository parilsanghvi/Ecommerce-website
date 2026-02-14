const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

const orderController = require('../../controllers/orderController');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');
const User = require('../../models/userModel');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Order.deleteMany({});
  await User.deleteMany({});
});

describe('updateOrder Integration Test', () => {
  jest.setTimeout(60000);

  it('should update stock correctly when order status changes to Shipped', async () => {
    // 1. Create a user
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      avatar: { public_id: "id", url: "url" }
    });

    // 2. Create a product with initial stock
    const product = await Product.create({
      name: "Test Product",
      description: "Desc",
      price: 100,
      ratings: 0,
      images: [{ public_id: "id", url: "url" }],
      category: "Cat",
      stock: 100,
      numOfReviews: 0,
      user: user._id
    });

    // 3. Create an order containing the product
    const order = await Order.create({
      shippingInfo: {
        address: "123 Main St",
        city: "City",
        state: "State",
        country: "Country",
        pinCode: 123456,
        phoneNo: 1234567890
      },
      orderItems: [{
        name: product.name,
        quantity: 5,
        price: product.price,
        image: "url",
        product: product._id
      }],
      user: user._id,
      paymentInfo: { id: "payment_id", status: "succeeded" },
      paidAt: Date.now(),
      itemsPrice: 500,
      taxPrice: 50,
      shippingPrice: 10,
      totalPrice: 560,
      orderStatus: "Processing"
    });

    // 4. Call updateOrder to ship the order
    const req = {
      params: { id: order._id },
      body: { status: "Shipped" }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await orderController.updateOrder(req, res, next);

    // 5. Verify response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });

    // 6. Verify stock update
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(95); // 100 - 5 = 95
  });

  it('should handle multiple items correctly', async () => {
    // 1. Create a user
    const user = await User.create({
      name: "Test User 2",
      email: "test2@example.com",
      password: "password123",
      avatar: { public_id: "id", url: "url" }
    });

    // 2. Create two products
    const product1 = await Product.create({
      name: "Product 1",
      description: "Desc",
      price: 100,
      images: [{ public_id: "id", url: "url" }],
      category: "Cat",
      stock: 50,
      user: user._id
    });

    const product2 = await Product.create({
      name: "Product 2",
      description: "Desc",
      price: 200,
      images: [{ public_id: "id", url: "url" }],
      category: "Cat",
      stock: 30,
      user: user._id
    });

    // 3. Create an order with both products
    const order = await Order.create({
      shippingInfo: {
        address: "123 Main St",
        city: "City",
        state: "State",
        country: "Country",
        pinCode: 123456,
        phoneNo: 1234567890
      },
      orderItems: [
        {
          name: product1.name,
          quantity: 2,
          price: product1.price,
          image: "url",
          product: product1._id
        },
        {
          name: product2.name,
          quantity: 3,
          price: product2.price,
          image: "url",
          product: product2._id
        }
      ],
      user: user._id,
      paymentInfo: { id: "payment_id", status: "succeeded" },
      paidAt: Date.now(),
      itemsPrice: 800,
      taxPrice: 80,
      shippingPrice: 10,
      totalPrice: 890,
      orderStatus: "Processing"
    });

    // 4. Update order to Shipped
    const req = {
      params: { id: order._id },
      body: { status: "Shipped" }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await orderController.updateOrder(req, res, next);

    // 5. Verify stocks
    const updatedProduct1 = await Product.findById(product1._id);
    const updatedProduct2 = await Product.findById(product2._id);

    expect(updatedProduct1.stock).toBe(48); // 50 - 2
    expect(updatedProduct2.stock).toBe(27); // 30 - 3
  });
});
