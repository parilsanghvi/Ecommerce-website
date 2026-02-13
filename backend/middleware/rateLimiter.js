const rateLimiter = (windowMs, maxRequest, message) => {
  const rateLimit = new Map();

  // Clean up periodically (every 10 minutes)
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimit.entries()) {
        // Remove entries older than the window
        if (now - data.startTime > windowMs) {
            rateLimit.delete(ip);
        }
    }
  }, 10 * 60 * 1000);

  // Ensure the interval doesn't prevent the process from exiting
  if (interval.unref) interval.unref();

  return (req, res, next) => {
    // Skip rate limiting in test environment unless explicitly enabled
    if (process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT) {
      return next();
    }

    const ip = req.ip;
    const now = Date.now();

    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, { count: 1, startTime: now });
      return next();
    }

    const requestData = rateLimit.get(ip);

    // Check if window has expired
    if (now - requestData.startTime > windowMs) {
      // Window expired, reset
      rateLimit.set(ip, { count: 1, startTime: now });
      return next();
    }

    // Check if limit exceeded
    if (requestData.count >= maxRequest) {
      return res.status(429).json({
        success: false,
        message: message || "Too many requests, please try again later."
      });
    }

    // Increment count
    requestData.count++;
    next();
  };
};

module.exports = rateLimiter;
