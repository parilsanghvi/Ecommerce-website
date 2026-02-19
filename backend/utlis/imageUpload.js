const cloudinary = require("cloudinary");

/**
 * Uploads an image to Cloudinary.
 * @param {Object|string} file - The file to upload. Can be a buffer (from multer) or a string (base64/URL).
 * @param {string} folder - The folder in Cloudinary to upload to.
 * @param {Object} [options={}] - Additional options for Cloudinary upload.
 * @returns {Promise<Object>} - The uploaded image details (public_id, url).
 */
exports.uploadImage = (file, folder, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: folder,
            ...options
        };

        if (file && file.buffer) {
            // Buffer upload (e.g., from multer)
            const uploadStream = cloudinary.v2.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) return reject(error);
                    resolve({
                        public_id: result.public_id,
                        url: result.secure_url
                    });
                }
            );
            uploadStream.end(file.buffer);
        } else if (typeof file === 'string') {
            // Base64 or URL upload
            cloudinary.v2.uploader.upload(file, uploadOptions)
                .then((result) => {
                    resolve({
                        public_id: result.public_id,
                        url: result.secure_url
                    });
                })
                .catch((error) => {
                    reject(error);
                });
        } else {
            reject(new Error("Invalid file format. Expected buffer or string."));
        }
    });
};
