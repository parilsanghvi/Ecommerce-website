const multer = require("multer");

// We use memoryStorage by default, though if we only parse text fields (Base64), simpler config works.
// However, to be robust, we configure memory storage.
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit matching express limits
});

module.exports = upload;
