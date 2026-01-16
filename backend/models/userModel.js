const mongoose = require('mongoose');
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const crypto = require("crypto")
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "please Enter your name"],
        maxLength: [30, "Name cannot exceed 30 characters"],
        minLength: [2, "Name cannot be shorter than 3 characters"],
    },
    email: {
        type: String,
        required: [true, "please Enter your email"],
        unique: true,
        validate: [validator.isEmail, "Please enter valid email"]
    },
    password: {
        type: String,
        required: [true, "please Enter your password"],
        minlength: [8, "password should be greater than 8 characters"],
        select: false,
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    role: {
        type: String,
        default: "user",
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
})
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
})

// jwt token
userSchema.methods.getJWTToken = function () {
    const accesstoken = jwt.sign({
        id: this._id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    })
    return accesstoken;
}
// compare Password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password)
}
// genrating password reset password
userSchema.methods.getResetPasswordToken = function () {

    // genrating token
    const resetToken = crypto.randomBytes(20).toString("hex");
    // hashing and adding to userSchema
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
}
module.exports = mongoose.model("User", userSchema)