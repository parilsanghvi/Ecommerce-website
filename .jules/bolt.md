## 2025-01-24 - User Controller Optimization
**Learning:** `isAuthenticatedUser` middleware already fetches and attaches the full user document to `req.user`. Subsequent controllers like `getUserDetails` often re-fetch the user from the DB using `req.user.id`, which is a redundant operation.
**Action:** In controllers following authentication middleware, check if `req.user` already contains the necessary data before making another DB call.

## 2025-02-21 - Delete Review Optimization
**Learning:** Fetching an entire parent document just to delete one item from an array (e.g., reviews in a product) is a massive performance bottleneck and a race condition (overwriting entire array).
**Action:** Use `findOne` with projection (e.g., `reviews: { $elemMatch: { _id: id } }`) to fetch only necessary data for validation, and use `$pull` in `findByIdAndUpdate` for atomic removal.
