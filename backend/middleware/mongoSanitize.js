// Middleware to sanitize user input to prevent NoSQL injection
const sanitize = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$/.test(key)) {
                delete obj[key];
            } else {
                sanitize(obj[key]);
            }
        }
    }
    return obj;
};

const mongoSanitize = (req, res, next) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
};

module.exports = mongoSanitize;
