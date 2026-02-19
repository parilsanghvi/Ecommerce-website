const cloudinary = require("cloudinary");

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

module.exports = { processImages };
