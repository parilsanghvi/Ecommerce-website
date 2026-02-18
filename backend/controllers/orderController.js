const Order = require("../models/orderModel")
const User = require("../models/userModel");
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

    // Verify itemsPrice against database
    const productIds = orderItems.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    let calculatedItemsPrice = 0;
    for (const item of orderItems) {
        const product = products.find(p => p._id.toString() === item.product);
        if (!product) {
            return next(new ErrorHandler(`Product not found: ${item.product}`, 404));
        }
        calculatedItemsPrice += product.price * item.quantity;
    }

    // Security Fix: Ensure all price fields are numbers and match calculations
    if (isNaN(itemsPrice) || Math.abs(Number(itemsPrice) - calculatedItemsPrice) > 0.01) {
        return next(new ErrorHandler("Price mismatch detected. Please refresh and try again.", 400));
    }

    // Security Fix: Validate all price components to prevent tampering
    // Calculate expected tax (18%) and shipping (Free over 1000, else 200)
    // Note: This logic duplicates frontend logic and should ideally be centralized
    const calculatedTaxPrice = calculatedItemsPrice * 0.18;
    const calculatedShippingPrice = calculatedItemsPrice > 1000 ? 0 : 200;
    const calculatedTotalPrice = calculatedItemsPrice + calculatedTaxPrice + calculatedShippingPrice;

    if (isNaN(taxPrice) || Math.abs(Number(taxPrice) - calculatedTaxPrice) > 0.01) {
        return next(new ErrorHandler("Tax price mismatch detected. Please refresh and try again.", 400));
    }

    if (isNaN(shippingPrice) || Math.abs(Number(shippingPrice) - calculatedShippingPrice) > 0.01) {
        return next(new ErrorHandler("Shipping price mismatch detected. Please refresh and try again.", 400));
    }

    if (isNaN(totalPrice) || Math.abs(Number(totalPrice) - calculatedTotalPrice) > 0.01) {
        return next(new ErrorHandler("Total price mismatch detected. Please refresh and try again.", 400));
    }

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
    // Bolt Optimization: Removed .populate() to save a DB call. We attach req.user details manually.
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
        return next(new ErrorHandler("order not found with this id", 404))
    }

    // Security Fix: Prevent IDOR by ensuring user owns the order or is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return next(new ErrorHandler("order not found with this id", 404));
    }

    // Optimized: Manually populate user info to avoid extra DB call
    if (order.user.toString() === req.user._id.toString()) {
        order.user = {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
        };
    } else {
        // Admin viewing another user's order
        const user = await User.findById(order.user).select("name email").lean();
        order.user = user;
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
    // Optimized: Use estimatedDocumentCount() for faster counting of all documents
    const ordersCountPromise = Order.estimatedDocumentCount();

    let aggregatePromise = Promise.resolve([]);

    // Optimize: Only calculate total revenue when explicitly requested (e.g. for Dashboard)
    // This avoids scanning the entire orders collection on every page load
    if (req.query.calculateTotal === "true") {
        aggregatePromise = Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalPrice" }
                }
            }
        ]);
    }

    const apifeature = new Apifeatures(Order.find(), req.query)
        .pagiNation(resultPerPage);

    // Optimized: Use lean() for faster read-only access
    const ordersPromise = apifeature.query.lean();

    const [ordersCount, aggregateResult, orders] = await Promise.all([
        ordersCountPromise,
        aggregatePromise,
        ordersPromise
    ]);

    let totalAmount;
    if (req.query.calculateTotal === "true") {
        totalAmount = aggregateResult.length > 0 ? aggregateResult[0].totalAmount : 0;
    }

    const response = {
        success: true,
        orders,
        totalOrders: ordersCount,
        resultPerPage,
    };

    if (totalAmount !== undefined) {
        response.totalAmount = totalAmount;
    }

    res.status(200).json(response);
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


    if (req.body.status === "Shipped") {
        const operations = order.orderItems.map((item) => ({
            updateOne: {
                filter: { _id: item.product, stock: { $gte: item.quantity } },
                update: { $inc: { stock: -item.quantity } }
            }
        }));

        if (operations.length > 0) {
            const result = await Product.bulkWrite(operations);
            if (result.modifiedCount !== operations.length) {
                throw new ErrorHandler("Insufficient stock for one or more products", 400);
            }
        }
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