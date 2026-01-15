const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../backend/models/productModel');
const Order = require('../backend/models/orderModel');
const { updateOrder } = require('../backend/controllers/orderController');

// Mock dotenv config so backend/config/database doesn't complain if imported (though we invoke connection manually)
process.env.PORT = 4000;

async function runTest() {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Create a product
    const product = await Product.create({
        name: "Test Product",
        description: "Desc",
        price: 100,
        images: [{ public_id: "id", url: "url" }],
        category: "Test",
        stock: 10,
        user: new mongoose.Types.ObjectId(),
    });

    // Create an order
    const order = await Order.create({
        shippingInfo: {
            address: "123 St", city: "City", state: "State", country: "Country", pinCode: 123456, phoneNo: 1234567890
        },
        orderItems: [{
            name: product.name,
            quantity: 2,
            price: product.price,
            image: "url",
            product: product._id
        }],
        user: new mongoose.Types.ObjectId(),
        paymentInfo: { id: "pay_id", status: "succeeded" },
        paidAt: Date.now(),
        itemsPrice: 200,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: 200,
        orderStatus: "Processing"
    });

    // Mock Req, Res, Next
    const req = {
        params: { id: order._id },
        body: { status: "Shipped" }
    };

    const res = {
        status: function(code) {
            console.log("res.status called with", code);
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            console.log("res.json called with", data);
            this.data = data;
            return this;
        }
    };

    const next = (err) => {
        console.error("Next called with error:", err);
    };

    // Verify DB access
    const checkOrder = await Order.findById(order._id);
    console.log("Test script found order:", checkOrder ? "yes" : "no");

    console.log("Calling updateOrder...");
    await updateOrder(req, res, next);

    // Wait a bit just in case of race condition (if catchAsyncErrors is somehow not returning promise)
    await new Promise(r => setTimeout(r, 1000));

    console.log("Status Code:", res.statusCode);
    if (res.statusCode !== 200) {
        throw new Error("Expected status 200");
    }

    // Verify Stock Update
    const updatedProduct = await Product.findById(product._id);
    console.log("Original Stock: 10, Quantity: 2");
    console.log("New Stock:", updatedProduct.stock);

    if (updatedProduct.stock !== 8) {
        throw new Error(`Stock mismatch! Expected 8, got ${updatedProduct.stock}`);
    }

    console.log("Test Passed: Stock updated correctly.");

    await mongoose.disconnect();
    await mongod.stop();
}

runTest().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
