## 2025-01-24 - User Controller Optimization
**Learning:** `isAuthenticatedUser` middleware already fetches and attaches the full user document to `req.user`. Subsequent controllers like `getUserDetails` often re-fetch the user from the DB using `req.user.id`, which is a redundant operation.
**Action:** In controllers following authentication middleware, check if `req.user` already contains the necessary data before making another DB call.

## 2025-03-12 - Mongoose Collection Document Counting
**Learning:** `Model.countDocuments()` performs a full collection scan (O(N)), which scales poorly for large datasets when no query filters are provided.
**Action:** For unfiltered total counts (e.g., getting the total number of products for admin pagination), use `Model.estimatedDocumentCount()` which operates in O(1) time by leveraging internal collection metadata.
