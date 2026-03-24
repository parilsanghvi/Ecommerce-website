const fs = require('fs');
let code = fs.readFileSync('backend/tests/integration/review.test.js', 'utf8');

code = code.replace(/console\.log\(res\.body\); /g, '');

fs.writeFileSync('backend/tests/integration/review.test.js', code);
