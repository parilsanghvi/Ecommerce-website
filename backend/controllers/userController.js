const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail")
const crypto = require("crypto")
const cloudinary = require("cloudinary")
const Apifeatures = require("../utils/apifeatures");

const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3MB base64 string length

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
    if (typeof req.body.avatar === "string" && req.body.avatar.length > MAX_AVATAR_SIZE) {
        return next(new ErrorHandler("Avatar image size too large", 400));
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
    // Do not leak password hash in API response
    user.password = undefined;
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
        return next(new ErrorHandler("Invalid email or password", 401))
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }
    // Do not leak password hash in API response
    user.password = undefined;
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
        email: String(req.body.email),
    })
    if (!user) {
        return res.status(200).json({
            success: true,
            message: `If your email is registered, you will receive a password reset link shortly.`
        })
    }
    // get resetPassword Token
    const resetToken = await user.getResetPasswordToken();
    await user.save({
        validateBeforeSave: false
    });
    // Enforce the use of FRONTEND_URL to prevent Host Header Injection
    if (!process.env.FRONTEND_URL) {
        return next(new ErrorHandler("FRONTEND_URL is not configured on the server.", 500));
    }

    const clientUrl = process.env.FRONTEND_URL.replace(/\/$/, "");
    const resetPasswordUrl = `${clientUrl}/password/reset/${resetToken}`;
    const message = `your password reset token is :- \n\n ${resetPasswordUrl} \n\n if you have not requested this email then please ignore it`;
    // ⚡ Bolt: [performance improvement] Send email asynchronously without awaiting
    // This removes the external network call overhead from the response time.
    Promise.resolve(sendEmail({
        email: user.email,
        subject: `Ecommerce Password recovery`,
        message,
    })).catch(async (error) => {
        // Since we don't await, errors happen in the background.
        // We log the error and invalidate the token so it can't be used,
        // but the user will need to request another reset.
        console.error("Failed to send password reset email asynchronously:", error);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false }).catch(saveErr => {
            console.error("Failed to clear reset token after email failure:", saveErr);
        });
    });

    res.status(200).json({
        success: true,
        message: `If your email is registered, you will receive a password reset link shortly.`,
    });
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
    // Optimized: Use req.user from middleware instead of redundant DB call
    const user = req.user;
    res.status(200).json({
        success: true,
        user
    })
})
// update user password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("+password")
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("old password is incorrect ", 401))
    }
    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandler("password doesnot match", 401))
    }
    user.password = req.body.newPassword
    await user.save()
    // Do not leak password hash in API response
    user.password = undefined;
    sendToken(user, 200, res)
})
// update user profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }
    if (req.body.avatar && req.body.avatar !== "" && req.body.avatar !== "undefined") {
        if (typeof req.body.avatar === "string" && req.body.avatar.length > MAX_AVATAR_SIZE) {
            return next(new ErrorHandler("Avatar image size too large", 400));
        }
        // Optimized: Use req.user.avatar directly instead of redundant DB call
        const imageId = req.user.avatar.public_id;

        // ⚡ Bolt: [performance improvement] Parallelize Cloudinary destroy and upload operations
        // Previously these were sequential, taking T(destroy) + T(upload) time.
        // Now they run concurrently, taking MAX(T(destroy), T(upload)) time.
        const [, myCloud] = await Promise.all([
            cloudinary.v2.uploader.destroy(imageId),
            cloudinary.v2.uploader.upload(req.body.avatar, {
                folder: "avatars",
                width: 150,
                crop: "scale",
            })
        ]);

        newUserData.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        }
    }
    const user = await User.findByIdAndUpdate(req.user._id, newUserData, {
        new: true,
        runValidators: true,
    })
    res.status(200).json({
        success: true
    })
})
// get all users
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
    const resultPerPage = 10;

    const usersCountPromise = User.estimatedDocumentCount();

    const apifeature = new Apifeatures(User.find(), req.query).pagiNation(resultPerPage);

    // Optimized: Use lean() for faster read-only performance
    const usersPromise = apifeature.query.lean();

    const [totalUsers, users] = await Promise.all([
        usersCountPromise,
        usersPromise
    ]);

    res.status(200).json({
        success: true,
        users,
        totalUsers,
        resultPerPage
    })
})
// admin get single user detail
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
    // Optimized: Use lean() for faster read-only performance
    const user = await User.findById(req.params.id).lean();
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
    if (req.body.role && !['user', 'admin'].includes(req.body.role)) {
        return next(new ErrorHandler("Role can only be user or admin", 400));
    }

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
    // ⚡ Bolt: [performance improvement] Parallelize Cloudinary destroy and database delete
    // Previously these were sequential, taking T(destroy) + T(delete) time.
    // Now they run concurrently, taking MAX(T(destroy), T(delete)) time.
    await Promise.all([
        cloudinary.v2.uploader.destroy(imageId),
        user.deleteOne()
    ]);
    res.status(200).json({
        success: true,
        message: "user deleted successfully"
    })
})
