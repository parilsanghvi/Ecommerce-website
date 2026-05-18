const ErrorHandler = require("../utils/errorhandler")
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "internal server error"
    // wrong mongodb id error
    if (err.name == "CastError") {
        const message = `resource not found. invalid: ${err.path}`
        err = new ErrorHandler(message, 400);
    }
    // mongoose duplicate key error
    if (err.code === 11000) {
        const message = `duplicate ${Object.keys(err.keyValue)} entered `
        err = new ErrorHandler(message, 400);
    }
    // wrong jwt error
    if (err.name == "JsonWebTokenError") {
        const message = `Json Web Token is invalid try again `
        err = new ErrorHandler(message, 400);
    }
    // JWT expire error
    if (err.name == "TokenExpiredError") {
        const message = `Json Web Token is expired try again `
        err = new ErrorHandler(message, 400);
    }
    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        err = new ErrorHandler(message, 400);
    }

    // Security Fix: Prevent leaking sensitive error details on 500 responses in production
    let responseMessage = err.message;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION';
    if (err.statusCode === 500 && isProduction) {
        responseMessage = "internal server error";
    }

    res.status(err.statusCode).json({
        success: false,
        message: responseMessage
    })
}