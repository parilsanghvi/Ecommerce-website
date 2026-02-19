const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Product = require("../models/productModel");
const ErrorHandler = require("../utlis/errorhandler");

exports.processPayment = catchAsyncErrors(async (req, res, next) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new ErrorHandler("No items provided for payment", 400));
  }

  // Fetch products from database
  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });

  // Security: Calculate price on server
  let subtotal = 0;
  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.product);
    if (!product) {
       return next(new ErrorHandler(`Product not found: ${item.product}`, 404));
    }
    subtotal += product.price * item.quantity;
  }

  const shippingCharges = subtotal > 1000 ? 0 : 200;
  const tax = subtotal * 0.18;
  const totalPrice = subtotal + tax + shippingCharges;

  // Convert to lowest currency unit (paise) and round to avoid float issues
  const amount = Math.round(totalPrice * 100);

  const myPayment = await stripe.paymentIntents.create({
    amount: amount,
    currency: "inr",
    metadata: {
      company: "Ecommerce",
    },
  });

  res
    .status(200)
    .json({ success: true, client_secret: myPayment.client_secret });
});

exports.sendStripeApiKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});
