const fs = require('fs');

let content = fs.readFileSync('backend/models/productModel.js', 'utf8');

// Add toJSON / toObject virtuals options
content = content.replace(
    "    createdAt: {\n        type: Date,\n        // takes date from system\n        default: Date.now\n    }\n})",
    "    createdAt: {\n        type: Date,\n        // takes date from system\n        default: Date.now\n    }\n}, { toJSON: { virtuals: true }, toObject: { virtuals: true } })"
);

// Add virtual
content = content.replace(
    "// Create a text index on the name field for faster search queries",
    "// Create a virtual property for reviews to maintain backward compatibility\nproductSchema.virtual('reviews', {\n    ref: 'review',\n    localField: '_id',\n    foreignField: 'product',\n    justOne: false\n});\n\n// Create a text index on the name field for faster search queries"
);

fs.writeFileSync('backend/models/productModel.js', content);
console.log('Virtuals added successfully');
