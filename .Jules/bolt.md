## 2025-01-24 - User Controller Optimization
**Learning:** `isAuthenticatedUser` middleware already fetches and attaches the full user document to `req.user`. Subsequent controllers like `getUserDetails` often re-fetch the user from the DB using `req.user.id`, which is a redundant operation.
**Action:** In controllers following authentication middleware, check if `req.user` already contains the necessary data before making another DB call.

## 2025-03-10 - Use lean() and static deleteOne for product deletion
**Learning:** During read/delete operations where you just need the document data to perform secondary operations (like destroying images in Cloudinary) and then delete the document, using `Product.findById().lean()` avoids Mongoose document hydration overhead. Further, using `Product.deleteOne({ _id: id })` directly is more efficient than calling `.deleteOne()` on the hydrated document.
**Action:** Replaced `Product.findById(req.params.id)` with `Product.findById(req.params.id).lean()` and `product.deleteOne()` with `Product.deleteOne({ _id: req.params.id })` in `deleteProduct` controller.
