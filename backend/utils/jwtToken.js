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

    // Security Fix: Prevent password hash from leaking in the API response
    // When a user is queried with .select("+password") or created, the password field
    // will be included in the user object. We must strip it before sending to the client.
    if (user.password) {
        user.password = undefined;
    }

    res.status(statusCode).cookie("token",token,options).json({
        success:true,
        user,
    })
}
module.exports= sendToken;