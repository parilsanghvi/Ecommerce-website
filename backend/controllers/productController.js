// takes model for object insertion from prodectmodel
const Product = require("../models/productModel");
const ErrorHandler = require("../utlis/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Apifeatures = require("../utlis/apifeatures");
const cloudinary = require("cloudinary")
const { processImages, processImagesUpdate } = require("../utlis/imageHandler");
const validator = require("validator");

// create product --admin
// exports.(function_name) = rest of function {way to export functions ;) }
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    // takes json as input and adds to database according to schema
    // Product.create/find are operations on database with help of mongoose.export taken in Product

    // Process images using helper function
    const imagesLink = await processImages(req.files, req.body.images);

    req.body.user = req.user._id;
    req.body.images = imagesLink;
    const product = await Product.create(req.body);
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

    const apifeature = new Apifeatures(Product.find(), req.query)
        .search()
        .filter();

    // Optimized: Only count filtered documents if filters are applied
    let filteredProductsCountPromise;
    const { keyword, page, limit, ...filters } = req.query;
    const hasSearch = typeof keyword === 'string' && keyword.trim() !== "";
    const hasFilters = Object.keys(filters).length > 0;

    if (!hasSearch && !hasFilters) {
        filteredProductsCountPromise = Promise.resolve(productsCount);
    } else {
        filteredProductsCountPromise = apifeature.query.clone().countDocuments();
    }

    apifeature.pagiNation(resultPerPage);

    // Optimized: Use lean() for faster read-only performance (skips Mongoose hydration)
    // Optimized: Exclude heavy fields and slice images to reduce payload size without breaking UI features
    const productsPromise = apifeature.query
        .select({
            description: 0,
            reviews: 0,
            user: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
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
    // Optimized: Use lean() for faster read-only performance (skips Mongoose hydration)
    // Optimized: Select only necessary fields (name, price, stock, _id) to reduce payload size
    const products = await Product.find().select("name price stock").lean()
    res.status(200).json({
        success: true,
        products,
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

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment: sanitizedComment,
    }

    // Optimized: Fetch only necessary fields and check for existing review by this user
    // This avoids fetching the entire reviews array (O(1) payload vs O(N))
    const product = await Product.findOne(
        { _id: productId },
        { ratings: 1, numOfReviews: 1, reviews: { $elemMatch: { user: req.user._id } } }
    ).lean();

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const isReviewed = product.reviews && product.reviews.length > 0;
    const currentRatings = product.ratings || 0;
    const currentNumOfReviews = product.numOfReviews || 0;
    let newRatings;

    if (isReviewed) {
        // Update existing review
        const oldRating = product.reviews[0].rating;
        // Calculate new average: (OldAvg * Count - OldRating + NewRating) / Count
        if (currentNumOfReviews === 0) {
            newRatings = Number(rating);
        } else {
            newRatings = ((currentRatings * currentNumOfReviews) - oldRating + Number(rating)) / currentNumOfReviews;
        }

        await Product.updateOne(
            { _id: productId, "reviews.user": req.user._id },
            {
                $set: {
                    "reviews.$.rating": Number(rating),
                    "reviews.$.comment": sanitizedComment,
                    ratings: newRatings
                }
            }
        );
    } else {
        // Add new review
        // Calculate new average: (OldAvg * Count + NewRating) / (Count + 1)
        newRatings = ((currentRatings * currentNumOfReviews) + Number(rating)) / (currentNumOfReviews + 1);

        await Product.updateOne(
            { _id: productId },
            {
                $push: { reviews: review },
                $set: { ratings: newRatings },
                $inc: { numOfReviews: 1 }
            }
        );
    }

    res.status(200).json({
        success: true,
    })
})
// get all reviews of single product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    // Optimized: Use lean() for faster read access to reviews
    // Optimized: Select only reviews field to reduce payload size
    const product = await Product.findById(req.query.id).select("reviews").lean()
    if (!product) {
        return next(new ErrorHandler("product not found", 404))
    }
    const reviews = product.reviews
    res.status(200).json({
        success: true,
        reviews,
    })
})
// delete review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    // Optimized: Fetch only necessary fields (stats and the specific review)
    // Uses $elemMatch to get ONLY the review we want to delete, avoiding fetching the whole array
    const product = await Product.findOne(
        { _id: req.query.productId },
        { ratings: 1, numOfReviews: 1, reviews: { $elemMatch: { _id: req.query.id } } }
    ).lean();

    if (!product) {
        return next(new ErrorHandler("product not found", 404));
    }

    // Check if the review exists in the returned document
    // If $elemMatch found no match, reviews array will be empty
    const review = product.reviews && product.reviews.length > 0 ? product.reviews[0] : null;

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return next(new ErrorHandler("Not authorized to delete this review", 403));
    }

    // Calculate new stats mathematically
    const currentRatings = product.ratings || 0;
    const currentNumOfReviews = product.numOfReviews || 0;
    const oldRating = review.rating;

    let newRatings;
    let newNumOfReviews = currentNumOfReviews - 1;

    if (newNumOfReviews <= 0) {
        newRatings = 0;
        newNumOfReviews = 0;
    } else {
        // (Avg * Count - Rating) / (Count - 1)
        newRatings = ((currentRatings * currentNumOfReviews) - oldRating) / newNumOfReviews;
    }

    // Atomic update using $pull to remove the review and $set to update stats
    // This avoids sending the entire reviews array back to the server
    await Product.findByIdAndUpdate(req.query.productId, {
        $pull: { reviews: { _id: req.query.id } },
        $set: {
            ratings: newRatings,
            numOfReviews: newNumOfReviews
        }
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
    });
})