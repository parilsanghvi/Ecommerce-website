const Order = require("../models/orderModel")
const Product = require("../models/productModel");
const ErrorHandler = require("../utlis/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Apifeatures = require("../utlis/apifeatures");

// create new order
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
    } = req.body;
    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
        lala: req.user._id,
    })
    res.status(201).json({
        success: true,
        order
    })
});

// get single order
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
    // Optimized: Use lean() for faster read-only access to order details
    const order = await Order.findById(req.params.id).populate("user", "name email").lean();
    if (!order) {
        return next(new ErrorHandler("order not found with this id", 404))
    }
    res.status(200).json({
        success: true,
        order,
    })
})
// get loggedin user order
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
    // Optimized: Use lean() to improve performance when fetching multiple orders
    const orders = await Order.find({
        user: req.user._id
    }).lean()
    res.status(200).json({
        success: true,
        orders,
    });
});
// get all orders --admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
    const resultPerPage = 10;
    const ordersCountPromise = Order.countDocuments();

    const aggregatePromise = Order.aggregate([
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$totalPrice" }
            }
        }
    ]);

    const apifeature = new Apifeatures(Order.find(), req.query)
        .pagiNation(resultPerPage);

    const ordersPromise = apifeature.query;

    const [ordersCount, aggregateResult, orders] = await Promise.all([
        ordersCountPromise,
        aggregatePromise,
        ordersPromise
    ]);

    const totalAmount = aggregateResult.length > 0 ? aggregateResult[0].totalAmount : 0;

    res.status(200).json({
        success: true,
        totalAmount,
        orders,
        totalOrders: ordersCount,
        resultPerPage,
    });
});
// update order status --admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
    if (!order) {
        return next(new ErrorHandler("order not found with this id", 404))
    }
    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("you have recieved order", 400))
    }


    if (req.body.status==="Shipped") {
        await Promise.all(order.orderItems.map(async (item) => {
            await updateStock(item.product, item.quantity)
        }))
    }

    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now()
    }
    await order.save({
        validateBeforeSave: false
    });
    res.status(200).json({
        success: true,
    });
});

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    product.stock = product.stock - quantity;
    await product.save({
        validateBeforeSave: false
    })
}

// delete order --admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
    if (!order) {
        return next(new ErrorHandler("order not found with this id", 404))
    }
    await order.deleteOne()
    res.status(200).json({
        success: true,
    });
});