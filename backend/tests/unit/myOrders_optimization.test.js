const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Order = require('../../models/orderModel');
const User = require('../../models/userModel');

// Mock catchAsyncErrors to allow awaiting the controller function directly
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => func(req, res, next));
jest.setTimeout(30000);

// Mock Stripe before requiring controller
jest.mock('stripe', () => {
    return jest.fn(() => ({
        paymentIntents: {
            retrieve: jest.fn()
        }
    }));
});
const orderController = require('../../controllers/orderController');

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

afterEach(async () => {
  await Order.deleteMany({});
  await User.deleteMany({});
});

describe('My Orders Optimization', () => {
  it('should exclude heavy fields (shippingInfo, paymentInfo, user) but KEEP order details (items, dates)', async () => {
    // 1. Setup Data
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      avatar: { public_id: 'pid', url: 'url' }
    });

    const order = await Order.create({
      shippingInfo: {
        address: '123 Main St',
        city: 'City',
        state: 'State',
        country: 'Country',
        pinCode: 12345,
        phoneNo: 1234567890
      },
      orderItems: [
        {
          name: 'Product 1',
          price: 100,
          quantity: 2,
          image: 'http://very-long-url.com/image1.jpg',
          product: new mongoose.Types.ObjectId()
        },
        {
          name: 'Product 2',
          price: 200,
          quantity: 1,
          image: 'http://very-long-url.com/image2.jpg',
          product: new mongoose.Types.ObjectId()
        }
      ],
      user: user._id,
      paymentInfo: { id: 'pay_123', status: 'succeeded' },
      paidAt: Date.now(),
      itemsPrice: 400,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 400,
      orderStatus: 'Processing'
    });

    // 2. Simulate Controller Logic
    const req = { user: { _id: user._id } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await orderController.myOrders(req, res, next);

    if (next.mock.calls.length > 0) {
        console.error('Next was called with error:', next.mock.calls[0][0]);
    }

    // 3. Verify Response
    expect(res.status).toHaveBeenCalledWith(200);
    const responseData = res.json.mock.calls[0][0];
    const orders = responseData.orders;

    expect(orders).toHaveLength(1);
    const fetchedOrder = orders[0];

    // Check for ABSENCE of heavy fields (explicitly excluded)
    expect(fetchedOrder).not.toHaveProperty('shippingInfo');
    expect(fetchedOrder).not.toHaveProperty('paymentInfo');
    expect(fetchedOrder).not.toHaveProperty('user');

    // Check for PRESENCE of necessary fields (implicitly included)
    expect(fetchedOrder).toHaveProperty('totalPrice');
    expect(fetchedOrder).toHaveProperty('orderStatus');
    expect(fetchedOrder).toHaveProperty('_id');
    expect(fetchedOrder).toHaveProperty('itemsPrice');
    expect(fetchedOrder).toHaveProperty('taxPrice');
    expect(fetchedOrder).toHaveProperty('shippingPrice');
    expect(fetchedOrder).toHaveProperty('createdAt'); // Important for sorting/history
    expect(fetchedOrder).toHaveProperty('paidAt');

    // Check orderItems array structure (preserved)
    expect(fetchedOrder.orderItems).toHaveLength(2);
    // Elements SHOULD have 'image', 'name', 'price' (safe optimization strategy)
    expect(fetchedOrder.orderItems[0]).toHaveProperty('image');
    expect(fetchedOrder.orderItems[0]).toHaveProperty('name');
    expect(fetchedOrder.orderItems[0]).toHaveProperty('price');
  });
});
