const fs = require('fs');
let code = fs.readFileSync('backend/tests/security_xss.test.js', 'utf8');

code = code.replace(
    /const storedComment = setReviewsObj\.\$set\.reviews\.\$map\.in\.\$cond\[1\]\.comment;/g,
    `const storedComment = setReviewsObj.$set.reviews.$map.in.$cond[1].$mergeObjects[1].comment;`
);

fs.writeFileSync('backend/tests/security_xss.test.js', code);
