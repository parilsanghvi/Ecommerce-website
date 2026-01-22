const { z } = require("zod");
const ErrorHandler = require("../utlis/errorhandler");

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const message = result.error.errors.map((e) => e.message).join(", ");
        return next(new ErrorHandler(message, 400));
    }
    next();
};

module.exports = validate;
