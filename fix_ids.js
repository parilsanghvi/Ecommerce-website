const fs = require('fs');
let code = fs.readFileSync('backend/controllers/productController.js', 'utf8');

// Ensure mongoose is required for generating ObjectIds
if (!code.includes("const mongoose = require('mongoose');")) {
    code = code.replace("const ErrorHandler = require('../utils/errorhandler')", "const ErrorHandler = require('../utils/errorhandler');\nconst mongoose = require('mongoose');");
}

code = code.replace(
    /const review = \{\n\s+user: req\.user\._id,\n\s+name: req\.user\.name,\n\s+rating: Number\(rating\),\n\s+comment: sanitizedComment,\n\s+\}/,
    `const review = {
        _id: new mongoose.Types.ObjectId(),
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment: sanitizedComment,
    }`
);

// Fix the $map update for existing reviews
code = code.replace(
    /\{\n\s+user: "\$\$r\.user",\n\s+name: "\$\$r\.name",\n\s+rating: Number\(rating\),\n\s+comment: sanitizedComment\n\s+\}/g,
    `{
                                            $mergeObjects: [
                                                "$$r",
                                                {
                                                    rating: Number(rating),
                                                    comment: sanitizedComment
                                                }
                                            ]
                                        }`
);

fs.writeFileSync('backend/controllers/productController.js', code);
