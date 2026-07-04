const ErrorHandler = require("../utils/errorhandler")
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "internal server error"

    // Do not leak error details in production for 500 errors
    if (process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'production') {
        if (err.statusCode === 500) {
            err.message = 'Internal Server Error';
        }
    }

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

    // Prevent Information Disclosure in production for 500 errors
    let finalMessage = err.message;
    if (err.statusCode === 500 && (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION')) {
        console.error("Internal Server Error:", err); // Log actual error for debugging
        finalMessage = "Internal Server Error";
    }

    res.status(err.statusCode).json({
        success: false,
        message: finalMessage
    })
}
