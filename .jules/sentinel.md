## 2024-05-18 - [Insecure Multer Configuration]
**Vulnerability:** Found `upload.any()` used for file uploads in `backend/routes/productRoute.js`. This allows arbitrary file uploads on any field, potentially leading to arbitrary file processing or DoS vulnerabilities.
**Learning:** The use of `upload.any()` circumvents intended file restrictions and accepts all files.
**Prevention:** Always use restrictive Multer methods like `upload.single('field')` or `upload.array('field')` with explicitly defined fields to ensure only expected files are processed.
