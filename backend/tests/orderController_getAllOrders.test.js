const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock catchAsyncErrors to allow awaiting the controller function
jest.mock('../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));

const orderController = require('../controllers/orderController');
const Order = require('../models/orderModel');

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
  await Order.deleteMany({});
});

describe('getAllOrders Integration Test', () => {
  jest.setTimeout(60000);

  it('should return orders and counts correctly', async () => {
    // Seed data with 'user' field
    const userId = new mongoose.Types.ObjectId();
    const orderData = {
        shippingInfo: {
            address: "123 Main St",
            city: "City",
            state: "State",
            country: "Country",
            pinCode: 123456,
            phoneNo: 1234567890
        },
        orderItems: [{
            name: "Product 1",
            quantity: 1,
            price: 100,
            image: "image.jpg",
            product: new mongoose.Types.ObjectId()
        }],
        user: userId,
        paymentInfo: {
            id: "payment_id",
            status: "succeeded"
        },
        paidAt: new Date(),
        itemsPrice: 100,
        taxPrice: 10,
        shippingPrice: 10,
        totalPrice: 120,
        orderStatus: "processing"
    };

    await Order.create([
      { ...orderData, totalPrice: 120 },
      { ...orderData, totalPrice: 130 },
      { ...orderData, totalPrice: 140 },
    ]);

    const req = {
      query: {
        page: '1'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await orderController.getAllOrders(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseData = res.json.mock.calls[0][0];

    expect(responseData.success).toBe(true);
    expect(responseData.totalOrders).toBe(3);
    expect(responseData.orders.length).toBe(3);
    expect(responseData.totalAmount).toBe(120 + 130 + 140);
  });
});
