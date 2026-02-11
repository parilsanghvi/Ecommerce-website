const ErrorHandler = require("../utlis/errorhandler");

/**
 * Creates a rate limiter middleware.
 * @param {number} windowMs - Time window in milliseconds.
 * @param {number} max - Max number of requests allowed in the window.
 * @param {string} message - Error message to return when limit is exceeded.
 * @returns {function} Express middleware.
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 5, message = "Too many requests from this IP, please try again later") => {
    // Store request counts for each IP
    const requests = new Map();

    return (req, res, next) => {
        // Skip rate limiting in test environment unless explicitly enabled
        if (process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT) {
            return next();
        }

        // Get IP address (trust proxy must be enabled in app.js for this to work behind load balancers)
        const ip = req.ip;

        if (!requests.has(ip)) {
            // New IP: set count to 1 and schedule cleanup
            const timeoutId = setTimeout(() => {
                requests.delete(ip);
            }, windowMs);

            // Allow the process to exit even if this timeout is pending
            if (timeoutId.unref) {
                timeoutId.unref();
            }

            requests.set(ip, {
                count: 1,
                timeoutId
            });
            next();
        } else {
            const entry = requests.get(ip);
            entry.count += 1;

            if (entry.count > max) {
                return next(new ErrorHandler(message, 429));
            }

            next();
        }
    };
};

module.exports = createRateLimiter;
