const cloudinary = require("cloudinary");

/**
 * Handles image updates: separates images to keep, uploads new ones, and deletes removed ones.
 * @param {Array} currentImages - Array of existing image objects from the database.
 * @param {string|Array} newImagesInput - The new images input (URLs or Base64 strings).
 * @returns {Promise<Array>} - Array of image objects to be saved to the database.
 */
const processImagesUpdate = async (currentImages, newImagesInput) => {
    let images = [];

    // Normalize input to an array
    if (typeof newImagesInput === "string") {
        images.push(newImagesInput);
    } else {
        images = newImagesInput;
    }

    const imagesToKeep = [];
    const imagesToUpload = [];

    // Separate images into "To Keep" (URLs) and "To Upload" (Base64/New)
    images.forEach(img => {
        if (typeof img === 'string' && img.startsWith('http')) {
            imagesToKeep.push(img);
        } else {
            imagesToUpload.push(img);
        }
    });

    // Identify images to delete (present in DB but not in imagesToKeep)
    const imagesToDelete = currentImages.filter(img => !imagesToKeep.includes(img.url));

    // ⚡ Bolt: Execute delete and upload operations concurrently to reduce total wait time
    const [, newImagesLinks] = await Promise.all([
        // Delete removed images from Cloudinary
        Promise.all(imagesToDelete.map(image => cloudinary.v2.uploader.destroy(image.public_id))),
        // Upload new images
        Promise.all(imagesToUpload.map(async (image) => {
            const result = await cloudinary.v2.uploader.upload(image, {
                folder: "products",
            });
            return {
                public_id: result.public_id,
                url: result.secure_url
            };
        }))
    ]);

    // Keep the old image objects that matched the URLs
    const keptImagesObjects = currentImages.filter(img => imagesToKeep.includes(img.url));

    return [...keptImagesObjects, ...newImagesLinks];
};

const processImages = async (files, bodyImages) => {
    let imagesLink = [];

    // Optimized: Use multipart upload (req.files) to reduce payload size and memory usage
    if (files && files.length > 0) {
        imagesLink = await Promise.all(files.map((file) => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.v2.uploader.upload_stream(
                    {
                        folder: "products",
                        width: 150,
                        height: 200,
                        // crop: "scale",
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve({
                            public_id: result.public_id,
                            url: result.secure_url
                        });
                    }
                );
                uploadStream.end(file.buffer);
            });
        }));
    } else {
        // Fallback for Base64 (legacy/JSON support)
        let images = []
        if (typeof bodyImages === "string") {
            images.push(bodyImages)
        } else if (Array.isArray(bodyImages)) {
            images = bodyImages
        }

        if (images.length > 0) {
            imagesLink = await Promise.all(images.map(async (image) => {
                const result = await cloudinary.v2.uploader.upload(image, {
                    folder: "products",
                    width: 150,
                    height: 200,
                    // crop: "scale",
                });
                return {
                    public_id: result.public_id,
                    url: result.secure_url
                };
            }));
        }
    }
    return imagesLink;
};

module.exports = { processImages, processImagesUpdate };
