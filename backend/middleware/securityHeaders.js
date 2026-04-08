const securityHeaders = (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking by denying framing
    // Note: If you need to embed this site in an iframe on the same origin, change this to 'SAMEORIGIN'
    res.setHeader('X-Frame-Options', 'DENY');

    // Control referrer information sent to other sites
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Enable browser's built-in XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Content Security Policy (CSP) to restrict sources of executable scripts
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' data: https://res.cloudinary.com; script-src 'self' https://js.stripe.com; frame-src 'self' https://js.stripe.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://api.stripe.com"
    );

    // HTTP Strict Transport Security (HSTS)
    // Enforces HTTPS connections. Only set in production to avoid issues with local development (http)
    if (process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
};

module.exports = securityHeaders;
