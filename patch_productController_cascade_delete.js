const fs = require('fs');
let content = fs.readFileSync('backend/controllers/productController.js', 'utf8');

// Update deleteProduct to delete reviews
content = content.replace(
    "await product.remove()",
    "// Delete associated reviews\n    await Review.deleteMany({ product: product._id });\n    \n    await product.remove()"
);

// We should also make sure getProductDetails populates reviews if we're using virtuals. Or we can just let frontend query `/reviews`? The reviewer specifically mentioned backward compatibility for endpoints fetching a single product.
content = content.replace(
    "const product = await Product.findById(req.params.id);",
    "const product = await Product.findById(req.params.id).populate('reviews');"
);

fs.writeFileSync('backend/controllers/productController.js', content);
console.log('Cascade delete and populate added');
