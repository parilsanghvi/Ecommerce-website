const securityHeaders = (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking by denying framing
    // Note: If you need to embed this site in an iframe on the same origin, change this to 'SAMEORIGIN'
    res.setHeader('X-Frame-Options', 'DENY');

    // Control referrer information sent to other sites
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // HTTP Strict Transport Security (HSTS)
    // Enforces HTTPS connections. Only set in production to avoid issues with local development (http)
    if (process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
};

module.exports = securityHeaders;
