## 2025-02-27 - Restrictive Multer File Upload Configurations
**Vulnerability:** Found `upload.any()` used in backend routes (`backend/routes/productRoute.js`).
**Learning:** `upload.any()` is dangerous as it allows users to upload files via unexpected fields, potentially leading to DoS or arbitrary file upload vulnerabilities. The `images` field array in frontend multipart forms (`frontend/src/component/Admin/NewProduct.jsx`) expects `upload.array('images')`.
**Prevention:** Always use restrictive Multer configurations like `upload.single('field')` or `upload.array('field')` over `upload.any()` to strictly specify which file fields are expected by the server.
