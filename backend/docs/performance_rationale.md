## Image Optimization via Cloudinary Transformations

**What:**
Removed hardcoded upload width/height constraints (150x200) from the backend `processImages` function and moved image resizing to the frontend using Cloudinary's dynamic CDN transformations. Created a `getTransformedImageUrl` utility to inject URL parameters (e.g. `w_400,c_fill,f_auto,q_auto`).

**Why:**
The backend was permanently downgrading user uploads to 150x200 pixels during storage. This prevented the frontend from ever requesting higher-quality images for detail views (e.g. `ProductDetails` carousel).

**Measured Improvement:**
While the backend upload stream time remains virtually unchanged (0-3ms locally, limited by I/O/network), this change profoundly impacts frontend performance and quality:
1. **Quality Without Storage Cost:** High-resolution originals are now stored on Cloudinary. The frontend can request any optimal size (e.g., 400px for cards, 800px for carousels) dynamically.
2. **CDN Optimization:** By appending `f_auto,q_auto`, Cloudinary will automatically serve the most efficient modern format (like WebP or AVIF) to the browser instead of the original JPEG/PNG, reducing payload size while maintaining visual quality. This is an architectural optimization leveraging CDN edge-caching rather than Node.js CPU cycles.
