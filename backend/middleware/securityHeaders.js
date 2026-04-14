const securityHeaders = (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking by denying framing
    // Note: If you need to embed this site in an iframe on the same origin, change this to 'SAMEORIGIN'
    res.setHeader('X-Frame-Options', 'DENY');

    // Control referrer information sent to other sites
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Security Enhancement: Content-Security-Policy to prevent XSS and data injection
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https:;");

    // Enable X-XSS-Protection for legacy browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // HTTP Strict Transport Security (HSTS)
    // Enforces HTTPS connections. Only set in production to avoid issues with local development (http)
    if (process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
};

module.exports = securityHeaders;
