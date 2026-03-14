const Order = require("../models/orderModel")
const User = require("../models/userModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Apifeatures = require("../utils/apifeatures");
const { calculateOrderPrices } = require("../utils/pricing");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// get pricing details
exports.getPricing = catchAsyncErrors(async (req, res, next) => {
    const { itemsPrice } = req.query;

    if (!itemsPrice) {
        return next(new ErrorHandler("Please provide itemsPrice", 400));
    }

    const prices = calculateOrderPrices(itemsPrice);

    res.status(200).json({
        success: true,
        ...prices,
    });
});

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
    // ⚡ Bolt: [performance improvement] Select only required fields and use lean()
    const products = await Product.find({ _id: { $in: productIds } }).select("price").lean();

    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let calculatedItemsPrice = 0;
    for (const item of orderItems) {
        // Security Fix: Validate quantity to prevent negative quantity exploits
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
            return next(new ErrorHandler(`Invalid quantity for product: ${item.product}`, 400));
        }
        const product = productMap.get(String(item.product));
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
    const {
        taxPrice: calculatedTaxPrice,
        shippingPrice: calculatedShippingPrice,
        totalPrice: calculatedTotalPrice
    } = calculateOrderPrices(calculatedItemsPrice);

    if (isNaN(taxPrice) || Math.abs(Number(taxPrice) - calculatedTaxPrice) > 0.01) {
        return next(new ErrorHandler("Tax price mismatch detected. Please refresh and try again.", 400));
    }

    if (isNaN(shippingPrice) || Math.abs(Number(shippingPrice) - calculatedShippingPrice) > 0.01) {
        return next(new ErrorHandler("Shipping price mismatch detected. Please refresh and try again.", 400));
    }

    if (isNaN(totalPrice) || Math.abs(Number(totalPrice) - calculatedTotalPrice) > 0.01) {
        return next(new ErrorHandler("Total price mismatch detected. Please refresh and try again.", 400));
    }

    // Security Fix: Verify payment with Stripe
    if (!paymentInfo || !paymentInfo.id) {
        return next(new ErrorHandler("Payment Information is missing", 400));
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentInfo.id);

    if (paymentIntent.status !== "succeeded") {
        return next(new ErrorHandler("Payment not verified", 400));
    }

    if (paymentInfo.status !== "succeeded") {
        return next(new ErrorHandler("Payment status mismatch", 400));
    }

    // Verify amount matches (Stripe amount is in smallest currency unit, e.g., paise)
    // calculatedTotalPrice is in major unit (e.g. Rupees)
    if (paymentIntent.amount !== Math.round(calculatedTotalPrice * 100)) {
        return next(new ErrorHandler("Payment amount mismatch", 400));
    }

    // Check if payment is already used (Replay Attack Prevention)
    const existingOrder = await Order.findOne({ "paymentInfo.id": paymentInfo.id });
    if (existingOrder) {
        return next(new ErrorHandler("Payment already used", 400));
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
    // Bolt Optimization: Exclude heavy fields (shippingInfo, paymentInfo, user) that are not needed for the list view.
    // This reduces payload size significantly while preserving core order details like items and dates.
    const orders = await Order.find({
        user: req.user._id
    })
    .select("-shippingInfo -paymentInfo -user")
    .lean()

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

    if (order.orderStatus === "Shipped" && req.body.status === "Shipped") {
        return next(new ErrorHandler("Order has already been shipped", 400));
    }


    if (req.body.status === "Shipped") {
        // Pre-verify stock to prevent partial updates and data inconsistency
        const productIds = order.orderItems.map(item => item.product);
        // ⚡ Bolt: [performance improvement] Select only required fields and use lean()
        const products = await Product.find({ _id: { $in: productIds } }).select("stock").lean();

        // ⚡ Bolt: [performance improvement] Convert products array to Map for O(1) lookups
        // This reduces the overall time complexity from O(N*M) to O(N+M)
        const productsMap = new Map();
        products.forEach((p) => productsMap.set(p._id.toString(), p));

        let hasInsufficientStock = false;
        for (const item of order.orderItems) {
            const product = productsMap.get(item.product.toString());
            if (!product || product.stock < item.quantity) {
                hasInsufficientStock = true;
                break;
            }
        }

        if (hasInsufficientStock) {
            return next(new ErrorHandler("Insufficient stock for one or more products", 400));
        }

        const operations = order.orderItems.map((item) => ({
            updateOne: {
                filter: { _id: item.product, stock: { $gte: item.quantity } },
                update: { $inc: { stock: -item.quantity } }
            }
        }));

        if (operations.length > 0) {
            const result = await Product.bulkWrite(operations);
            if (result.modifiedCount !== operations.length) {
                return next(new ErrorHandler("Insufficient stock for one or more products", 400));
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