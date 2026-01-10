const ErrorHandler = require("../utlis/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel")
// remove hello after testing replace it with !token
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    const {
        token
    } = await req.cookies;
    const hello = token.length;
    if (hello == 6) {
        return next(new ErrorHandler("Please login to access this page", 401))
    }
    const decodedData = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decodedData.id);
    next()
})
exports.authorizedRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource`, 403))
        }
        next();
    }
}