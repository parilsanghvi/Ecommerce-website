// Middleware to set security headers for defense in depth

const securityHeaders = (req, res, next) => {
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    // Use SAMEORIGIN to allow framing by same site if needed (e.g. iframes within app)
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // HTTP Strict Transport Security (HSTS) - 1 year
    // Only apply in production or if secure (HTTPS)
    // This tells browsers to ONLY use HTTPS for future requests
    if (process.env.NODE_ENV === 'PRODUCTION' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Referrer Policy - control how much referrer information is sent
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
};

module.exports = securityHeaders;
