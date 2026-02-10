const rateLimit = new Map();

const rateLimiter = ({ windowMs = 15 * 60 * 1000, max = 5, message = "Too many requests, please try again later." } = {}) => {
    return (req, res, next) => {
        // Allow higher limits for testing environments unless explicitly testing rate limits
        let currentMax = max;
        if (process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT) {
            currentMax = 1000;
        }

        const ip = req.ip;
        const now = Date.now();

        const record = rateLimit.get(ip);

        if (!record) {
            rateLimit.set(ip, { count: 1, startTime: now });
            setTimeout(() => rateLimit.delete(ip), windowMs);
            return next();
        }

        if (now - record.startTime > windowMs) {
            // Should be handled by setTimeout, but as a fallback
            rateLimit.set(ip, { count: 1, startTime: now });
            setTimeout(() => rateLimit.delete(ip), windowMs);
            return next();
        }

        if (record.count >= currentMax) {
             return res.status(429).json({
                success: false,
                message: message
            });
        }

        record.count++;
        next();
    };
};

module.exports = rateLimiter;
