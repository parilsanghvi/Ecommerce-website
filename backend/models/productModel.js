const mongoose = require('mongoose')

// create schema
const productSchema = mongoose.Schema({
    // object field name
    name: {
        // object field input type default type = string
        type: String,
        // throws error if object field is empty [true,(if it is false it will give message after comma)"blah blah blah"]
        required: [true, "Please enter product name"],
        // dunno this 
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Please enter product description"],
        maxLength: [4000, "Description cannot exceed 4000 characters"]
    },
    price: {
        type: Number,
        required: [true, "Please enter product price"],
        // maxlength : if input is greater than 8 it will throw error
        maxLength: [8, "Price cannot be greater than 8 figures"],
        index: true // Optimize: Index for price range filtering
    },
    ratings: {
        type: Number,
        // we can also give default value
        default: 0,
        index: true // Optimize: Index for sorting and filtering by rating
    },
    images: [{
        // use [] to create an array of objects inside an object 
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    category: {
        type: String,
        required: [true, "please enter product category"],
        index: true // Optimize: Index for category filtering
    },
    stock: {
        type: Number,
        required: [true, "please enter product stock"],
        maxLength: [5, "stock cannot exceed 5 character"],
        default: 1,
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
        required: true,
    },
    createdAt: {
        type: Date,
        // takes date from system
        default: Date.now
    }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } })

// Create a virtual property for reviews to maintain backward compatibility
productSchema.virtual('reviews', {
    ref: 'review',
    localField: '_id',
    foreignField: 'product',
    justOne: false
});

// Create a text index on the name field for faster search queries
productSchema.index({ name: 'text' });

// exports mongoose model with productschema in "product" collection if such collection is not present it will create
module.exports = mongoose.model("product", productSchema);    