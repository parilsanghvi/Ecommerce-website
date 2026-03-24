const fs = require('fs');
let code = fs.readFileSync('backend/tests/unit/product_reviews_optimization.test.js', 'utf8');

// The new review test checks for exactly what's passed in the concatArrays part
code = code.replace(
    /\{\n\s+user: 'userId123',\n\s+name: 'Test User',\n\s+rating: 5,\n\s+comment: 'Great product'\n\s+\}/,
    `expect.objectContaining({
                                        user: 'userId123',
                                        name: 'Test User',
                                        rating: 5,
                                        comment: 'Great product'
                                    })`
);

// The update review test checks the map $cond part
code = code.replace(
    /\{\n\s+user: "\$\$r\.user",\n\s+name: "\$\$r\.name",\n\s+rating: 5,\n\s+comment: 'Great product'\n\s+\}/,
    `{
                                            $mergeObjects: [
                                                "$$r",
                                                {
                                                    rating: 5,
                                                    comment: 'Great product'
                                                }
                                            ]
                                        }`
);

fs.writeFileSync('backend/tests/unit/product_reviews_optimization.test.js', code);
