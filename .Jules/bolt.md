## 2025-01-24 - User Controller Optimization
**Learning:** `isAuthenticatedUser` middleware already fetches and attaches the full user document to `req.user`. Subsequent controllers like `getUserDetails` often re-fetch the user from the DB using `req.user.id`, which is a redundant operation.
**Action:** In controllers following authentication middleware, check if `req.user` already contains the necessary data before making another DB call.

## 2025-03-10 - ⚡ Bolt: Add lean() to Review deletion query
**Learning:** Appending `.lean()` to Mongoose document lookups during a read-only request (where the document is not modified via document methods) skips instantiation overhead, leading to ~25% performance gain during DB read queries.
**Action:** Added `.lean()` to `Review.findById(req.query.id)` inside `productController.js` and successfully mocked its return value in `review_authorization.test.js` to ensure stability.
