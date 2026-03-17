// create a token and saving in cookie
const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();
    // options for cookie
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    }

    // Security Fix: Prevent sensitive data exposure in responses
    // When mongoose queries use .select("+password"), the password field is included
    // in the document and will be leaked if the whole object is sent in the response.
    if (user) {
        user.password = undefined;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
    }

    res.status(statusCode).cookie("token",token,options).json({
        success:true,
        user,
    })
}
module.exports= sendToken;