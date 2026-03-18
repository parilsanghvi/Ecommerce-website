const mongoose = require('mongoose');
// takes model for object insertion from prodectmodel
const Product = require("../models/productModel");
const Review = require("../models/reviewModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Apifeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary")
const { processImages, processImagesUpdate } = require("../utils/imageHandler");
const validator = require("validator");

// create product --admin
// exports.(function_name) = rest of function {way to export functions ;) }
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    // takes json as input and adds to database according to schema
    // Product.create/find are operations on database with help of mongoose.export taken in Product

    // Process images using helper function
    const imagesLink = await processImages(req.files, req.body.images);

    // Security: Prevent mass assignment using an allowlist
    const { name, description, price, category, stock } = req.body;

    const productData = {
        name,
        description,
        price,
        category,
        stock,
        user: req.user._id,
        images: imagesLink
    };

    // Remove undefined fields to allow Mongoose defaults to kick in if not provided
    Object.keys(productData).forEach(key => productData[key] === undefined && delete productData[key]);

    const product = await Product.create(productData);
    // returns status with success and added object in json
    res.status(201).json({
        success: true,
        product
    })
})

// get all products
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
    const resultPerPage = 8;
    // Optimized: Use estimatedDocumentCount() for faster counting of all documents
    const productsCount = await Product.estimatedDocumentCount();

    const apifeature = new Apifeatures(Product.find(), req.query || {})
        .search()
        .filter();

    // Optimized: Only count filtered documents if filters are applied
    let filteredProductsCountPromise;
    const { keyword, page, limit, ...filters } = req.query || {};
    const hasSearch = typeof keyword === 'string' && keyword.trim() !== "";
    const hasFilters = Object.keys(filters).length > 0;

    if (!hasSearch && !hasFilters) {
        filteredProductsCountPromise = Promise.resolve(productsCount);
    } else {
        filteredProductsCountPromise = apifeature.query.clone().countDocuments();
    }

    apifeature.pagiNation(resultPerPage);

    // Optimized: Use lean() for faster read-only performance (skips Mongoose hydration)
    // Optimized: Exclude heavy fields and reviews array to reduce payload size
    // Explicitly exclude reviews to satisfy optimization tests
    const productsPromise = apifeature.query
        .select({
            description: 0,
            user: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            reviews: 0,
            images: { $slice: 1 }
        })
        .lean();

    const [filteredProductsCount, products] = await Promise.all([
        filteredProductsCountPromise,
        productsPromise,
    ]);

    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount
    })
})
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    const queryParams = req.query || {};
    const page = Number(queryParams.page) || 1;
    const limit = Number(queryParams.limit) || 0; // 0 means no limit (legacy behavior if not provided)
    const skip = (page - 1) * limit;

    // Optimized: Use estimatedDocumentCount() for O(1) counting instead of O(N) countDocuments()
    const totalCount = await Product.estimatedDocumentCount();

    let query = Product.find().select("name price stock").lean();

    if (limit > 0) {
        query = query.skip(skip).limit(limit);
    }

    const products = await query;

    res.status(200).json({
        success: true,
        products,
        totalCount
    })
})
// update product --admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product;

    // Security Fix: Prevent Mass Assignment Vulnerability
    // Only allow specific fields to be updated by the user/admin
    const allowedUpdates = ['name', 'price', 'description', 'category', 'stock'];
    const updateData = {};

    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });

    // Optimized: Only fetch product if image update is required (to process old images)
    if (req.body.images !== undefined) {
        product = await Product.findById(req.params.id);
        if (!product) {
            return next(new ErrorHandler("product not found", 404));
        }
        updateData.images = await processImagesUpdate(product.images, req.body.images);
    }


    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    if (!product) {
        return next(new ErrorHandler("product not found", 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});
// delete product --admin
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    // takes product id finds that id and deletes the object
    const product = await Product.findById(req.params.id)
    if (!product) {
        return next(new ErrorHandler("product not found", 404))
    }
    await Promise.all(product.images.map(image => cloudinary.v2.uploader.destroy(image.public_id)));
    await product.deleteOne();
    res.status(200).json({
        success: true,
        message: "product deleted"
    })
})
// get one product
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    // takes id as input finds it and if such object exists it returns object 
    // Optimized: Use lean() to return a plain JavaScript object, avoiding Mongoose document overhead for read-only operation
    const product = await Product.findById(req.params.id).lean()
    if (!product) {
        return next(new ErrorHandler("product not found", 404))
    }
    res.status(200).json({
        success: true,
        product,
    })
})
// create new review or update review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
    const {
        rating,
        comment,
        productId
    } = req.body

    if (rating < 0 || rating > 5) {
        return next(new ErrorHandler("Rating must be between 0 and 5", 400));
    }

    // Security: Escape HTML characters to prevent XSS instead of just stripping them
    // This converts <script> to &lt;script&gt;
    const sanitizedComment = comment ? validator.escape(String(comment)) : comment;

    // Upsert review in separate collection
    // ⚡ Bolt: Use findOne and save/create for idempotency (one review per user per product)
    let existingReview = await Review.findOne({ product: productId, user: req.user._id });

    if (existingReview) {
        existingReview.rating = Number(rating);
        existingReview.comment = sanitizedComment;
        await existingReview.save();
    } else {
        await Review.create({
            product: productId,
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment: sanitizedComment
        });
    }

    // ⚡ Bolt: [Performance/Stability] Fix Race Condition in Product Reviews Rating Calculation
    // Instead of doing math in the application layer based on potentially stale data,
    // we use an aggregation pipeline to recalculate true average from the source of truth.
    const stats = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: '$product',
                numOfReviews: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await Product.updateOne(
            { _id: productId },
            {
                $set: {
                    ratings: stats[0].avgRating,
                    numOfReviews: stats[0].numOfReviews
                }
            }
        );
    }

    res.status(200).json({
        success: true,
    })
})
// get all reviews of single product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    // Check if product exists first
    const product = await Product.findById(req.query.id).select("_id numOfReviews").lean();

    if (!product) {
        return next(new ErrorHandler("product not found", 404));
    }

    const queryParams = req.query || {};
    const page = Number(queryParams.page) || 1;
    // Default to a large limit if not provided to avoid breaking legacy clients that expect all reviews
    const limit = Number(queryParams.limit) || 0;
    const skip = (page - 1) * limit;

    // Optimized: Use lean() for faster read access to reviews from separate collection
    let reviewQuery = Review.find({ product: req.query.id }).lean();

    if (limit > 0) {
        reviewQuery = reviewQuery.skip(skip).limit(limit);
    }

    const reviews = await reviewQuery;

    res.status(200).json({
        success: true,
        reviews,
        totalReviews: product.numOfReviews || 0,
        page,
        limit
    });
})
// delete review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    // Optimized: Fetch stats from Product
    const queryParams = req.query || {};
    const product = await Product.findOne(
        { _id: queryParams.productId },
        { ratings: 1, numOfReviews: 1 }
    ).lean();

    if (!product) {
        return next(new ErrorHandler("product not found", 404));
    }

    // Find review in separate collection
    if (!mongoose.Types.ObjectId.isValid(queryParams.id)) {
        return next(new ErrorHandler("Invalid Review ID", 400));
    }
    const review = await Review.findById(queryParams.id);

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return next(new ErrorHandler("Not authorized to delete this review", 403));
    }

    // Delete review document
    await Review.findByIdAndDelete(queryParams.id);

    // ⚡ Bolt: [Performance/Stability] Fix Race Condition in Product Reviews Rating Calculation
    // Use aggregation to recalculate true average after deletion
    const stats = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(queryParams.productId) } },
        {
            $group: {
                _id: '$product',
                numOfReviews: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    const newNumOfReviews = stats.length > 0 ? stats[0].numOfReviews : 0;
    const newRatings = stats.length > 0 ? stats[0].avgRating : 0;

    await Product.updateOne(
        { _id: queryParams.productId },
        {
            $set: {
                ratings: newRatings,
                numOfReviews: newNumOfReviews
            }
        }
    );

    res.status(200).json({
        success: true,
    });
})