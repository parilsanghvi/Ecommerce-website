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
    } else {
        images = req.body.images
    }
    const imagesLink = []
    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
            width: 150,
            height:200,
            // crop: "scale",
        })
        imagesLink.push({
            public_id: result.public_id,
            url: result.secure_url
        })
    }
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
    const productsCount = await Product.countDocuments();

    const apifeature = new Apifeatures(Product.find(), req.query)
        .search()
        .filter()
        .pagiNation(resultPerPage)
    const products = await apifeature.query;
    let filteredProductsCount = products.length;
    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount
    })
})
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find()
    res.status(200).json({
        success: true,
        products,
    })
})
// update product --admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    // takes json and product id as input finds object by that id if such object exists it again finds by id and updates it and returns success with modified object
    let product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("product not found", 404))
    }
    // images update
    let images = []
    if (typeof req.body.images === "string") {
        images.push(req.body.images)
    } else {
        images = req.body.images
    }
    if (images !== undefined) {
        // Deleting Images From Cloudinary
        const deletePromises = product.images.map((image) =>
            cloudinary.v2.uploader.destroy(image.public_id)
        );

        await Promise.all(deletePromises);

        // Uploading New Images to Cloudinary
        const uploadPromises = images.map((image) =>
            cloudinary.v2.uploader.upload(image, {
                folder: "products",
                height: 200,
                crop: "scale",
            })
        );

        const results = await Promise.all(uploadPromises);

        req.body.images = results.map((result) => ({
            public_id: result.public_id,
            url: result.secure_url,
        }));
    }
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        useFindAndModify: false
    })
    res.status(200).json({
        success: true,
        product,
    })
})
// delete product --admin
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    // takes product id finds that id and deletes the object
    const product = await Product.findById(req.params.id)
    if (!product) {
        return next(new ErrorHandler("product not found", 404))
    }
    // Deleting Images From Cloudinary
    const deletePromises = product.images.map((image) =>
        cloudinary.v2.uploader.destroy(image.public_id)
    );

    await Promise.all(deletePromises);

    await product.remove();
    res.status(200).json({
        success: true,
        message: "product deleted"
    })
})
// get one product
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    // takes id as input finds it and if such object exists it returns object 
    const product = await Product.findById(req.params.id)
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
    const product = await Product.findById(req.query.id)
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
    }), {
        new: true,
        runValidators: true,
        userFindAndModify: false
    }

    res.status(200).json({
        success: true,

    })
})