/**
 * Transforms a Cloudinary URL to request specific dimensions and crops.
 * @param {string} url - Original Cloudinary image URL
 * @param {Object} options - Transformation options (width, height, crop)
 * @returns {string} - Transformed URL or original URL if it's not a Cloudinary URL
 */
export const getTransformedImageUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url;
  }

  const { width, height, crop = 'scale' } = options;
  const transformations = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);

  // Adding f_auto and q_auto for automatic format selection and quality compression optimization
  transformations.push('f_auto', 'q_auto');

  const transformationString = transformations.join(',');

  // Cloudinary URLs typically look like:
  // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>
  // We want to insert the transformation string right after 'upload/'

  const uploadToken = '/upload/';
  const uploadIndex = url.indexOf(uploadToken);

  if (uploadIndex === -1) {
    return url; // Return original if pattern doesn't match
  }

  const beforeUpload = url.substring(0, uploadIndex + uploadToken.length);
  const afterUpload = url.substring(uploadIndex + uploadToken.length);

  return `${beforeUpload}${transformationString}/${afterUpload}`;
};
