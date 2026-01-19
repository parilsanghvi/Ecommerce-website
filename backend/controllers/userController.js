const ErrorHandler = require("../utlis/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utlis/jwtToken");
const sendEmail = require("../utlis/sendEmail")
const crypto = require("crypto")
const cloudinary = require("cloudinary")

// register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {

    const {
        name,
        email,
        password,
    } = req.body;
    if (!req.body.avatar) {
        return next(new ErrorHandler("Please upload avatar", 401))
    }
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
    })
    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    });
    sendToken(user, 201, res)
})
// login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const {
        email,
        password
    } = req.body;
    // checking if user has goven password and email both
    if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 401))
    }
    const user = await User.findOne({
        email
    }).select("+password");
    if (!user) {
        next(new ErrorHandler("invalid email"), 401)
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        next(new ErrorHandler("invalid password"), 401)
    }
    sendToken(user, 200, res)
})
// logout user
exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: "user logged out"
    })
})
// forgot password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({
        email: req.body.email,
    })
    if (!user) {
        return next(new ErrorHandler("user not found", 404))
    }
    // get resetPassword Token
    const resetToken = await user.getResetPasswordToken();
    await user.save({
        validateBeforeSave: false
    });
    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`
    const message = `your password reset token is :- \n\n ${resetPasswordUrl} \n\n if you have not requested this email then please ignore it`;
    try {
        await sendEmail({
            email: user.email,
            subject: `Ecommerce Password recovery`,
            message,
        })
        res.status(200).json({
            success: true,
            message: `email sent to ${user.email} successfully`,
        })
    } catch (error) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined
        await user.save({
            validateBeforeSave: false
        });
        return next(new ErrorHandler(error.message, 500))
    }
})
// reset password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    // creating token hash
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now()
        }
    })
    if (!user) {
        return next(new ErrorHandler("reset password token is invalid or has been expired", 404))
    }
    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password doesnot match", 404))
    }
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save();
    sendToken(user, 200, res);
})
// get user detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id)
    res.status(200).json({
        success: true,
        user
    })
})
// update user password
exports.updatePassoword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password")
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("old password is incorrect ", 401))
    }
    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandler("password doesnot match", 401))
    }
    user.password = req.body.newPassword
    await user.save()
    sendToken(user, 200, res)
})
// update user profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }
    if (req.body.avatar !== "") {
        const user = await User.findById(req.user.id)
        if (req.body.avatar==="undefined") {
            return next(new ErrorHandler("Please upload a new avatar", 401))
        }
        const imageId = user.avatar.public_id
        await cloudinary.v2.uploader.destroy(imageId);
        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
        })

        newUserData.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    })
    res.status(200).json({
        success: true
    })
})
// get all users
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
})
// admin get single user detail
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if ((!user)) {
        return next(new ErrorHandler(`user doesnot exist with id: ${req.params.id}`, 400))
    }
    res.status(200).json({
        success: true,
        user
    })
})
// update user role
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }
    await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
    })
    res.status(200).json({
        success: true
    })
})
// delete user --admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`user doesnot exist with id of ${req.params.id}`, 404))
    }
    const imageId = user.avatar.public_id
    await cloudinary.v2.uploader.destroy(imageId);
    await user.deleteOne();
    res.status(200).json({
        success: true,
        message: "user deleted successfully"
    })
})