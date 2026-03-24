const fs = require('fs');
let code = fs.readFileSync('backend/controllers/productController.js', 'utf8');
if (!code.includes("const mongoose = require('mongoose');")) {
    code = `const mongoose = require('mongoose');\n` + code;
    fs.writeFileSync('backend/controllers/productController.js', code);
}
