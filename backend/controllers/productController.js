// takes model for object insertion from prodectmodel
const Product = require("../models/productModel");
const ErrorHandler = require("../utlis/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Apifeatures = require("../utlis/apifeatures");
const cloudinary = require("cloudinary")

// create product --admin
// exports.(function_name) = rest of function {way to export functions ;) }
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    // takes json as input and adds to database according to schema
    // Product.create/find are operations on database with help of mongoose.export taken in Product
    let images = []
    if (typeof req.body.images === "string") {
        images.push(req.body.images)
    } else if (Array.isArray(req.body.images)) {
        images = req.body.images
    }
    const imagesLink = await Promise.all(images.map(async (image) => {
        const result = await cloudinary.v2.uploader.upload(image, {
            folder: "products",
            width: 150,
            height: 200,
            // crop: "scale",
        });
        return {
            public_id: result.public_id,
            url: result.secure_url
        };
    }));

    req.body.user = req.user.id;
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

    let filteredProductsCount = await apifeature.query.clone().countDocuments();

    apifeature.pagiNation(resultPerPage);

    // Optimized: Use lean() for faster read-only performance (skips Mongoose hydration)
    const products = await apifeature.query.lean();

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
    const products = await Product.find().lean()
    res.status(200).json({
        success: true,
        products,
    })
})
// update product --admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("product not found", 404))
    }

    // Images Handling
    let images = [];
    if (req.body.images !== undefined) {
        if (typeof req.body.images === "string") {
            images.push(req.body.images);
        } else {
            images = req.body.images;
        }
    }

    if (images.length > 0 || req.body.images !== undefined) {
        // 1. Separate images into "To Keep" (URLs) and "To Upload" (Base64/New)
        const imagesToKeep = [];
        const imagesToUpload = [];

        images.forEach(img => {
            if (typeof img === 'string' && img.startsWith('http')) {
                imagesToKeep.push(img);
            } else {
                imagesToUpload.push(img);
            }
        });

        // 2. Identify images to delete (present in DB but not in imagesToKeep)
        const imagesToDelete = product.images.filter(img => !imagesToKeep.includes(img.url));

        // 3. Delete removed images from Cloudinary
        await Promise.all(imagesToDelete.map(image => cloudinary.v2.uploader.destroy(image.public_id)));

        // 4. Upload new images
        const newImagesLinks = await Promise.all(imagesToUpload.map(async (image) => {
            const result = await cloudinary.v2.uploader.upload(image, {
                folder: "products",
                // width: 150,
                // height: 200,
                // crop: "scale",
            });
            return {
                public_id: result.public_id,
                url: result.secure_url
            };
        }));

        // 5. Reconstruct the final images array
        // Keep the old image objects that matched the URLs
        const keptImagesObjects = product.images.filter(img => imagesToKeep.includes(img.url));

        req.body.images = [...keptImagesObjects, ...newImagesLinks];
    } else {
        // If images is undefined/empty but not explicitly empty string/array, we might want to keep existing?
        // But if frontend sends empty list, it means delete all. 
        // Based on existing logic: if invalid/undefined, we might ignore. 
        // Adapting to safe default: if undefined, do nothing. If empty array, delete all.
        // The above logic handles empty array (imagesToDelete will be all).
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

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
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    }
    const product = await Product.findById(productId)
    const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString())
    if (isReviewed) {
        product.reviews.forEach((rev) => {
            if (rev.user.toString() === req.user._id.toString())
                rev.rating = rating, rev.comment = comment;
        })
    } else {
        product.reviews.push(review)
        product.numOfReviews = product.reviews.length
    }
    let avg = 0;
    product.reviews.forEach((rev) => {
        avg += rev.rating
    })
    product.ratings = avg / product.reviews.length;
    await product.save({
        validateBeforeSave: false,
    })
    res.status(200).json({
        success: true,
        product
    })
})
// get all reviews of single product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    // Optimized: Use lean() for faster read access to reviews
    const product = await Product.findById(req.query.id).lean()
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
    const product = await Product.findById(req.query.productId)

    if (!product) {
        return next(new ErrorHandler("product not found", 404))
    }

    const review = product.reviews.find(
        (rev) => rev._id.toString() === req.query.id.toString()
    );

    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return next(new ErrorHandler("Not authorized to delete this review", 403));
    }

    const reviews = product.reviews.filter(
        (rev) => rev._id.toString() !== req.query.id.toString()
    );

    let avg = 0;

    reviews.forEach((rev) => {
        avg += rev.rating
    })
    let ratings = 0
    if (reviews.length === 0) {
        ratings = 0
    } else {
        ratings = avg / reviews.length;
    }

    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        success: true,

    })
})