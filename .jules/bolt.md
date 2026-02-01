## 2025-01-24 - User Controller Optimization
**Learning:** `isAuthenticatedUser` middleware already fetches and attaches the full user document to `req.user`. Subsequent controllers like `getUserDetails` often re-fetch the user from the DB using `req.user.id`, which is a redundant operation.
**Action:** In controllers following authentication middleware, check if `req.user` already contains the necessary data before making another DB call.

## 2025-01-24 - Atomic Stock Updates
**Learning:** `Product.updateOne` with `$inc` is much more efficient and safer for concurrent updates than `findById` + manual subtraction + `save`.
**Action:** Use atomic operators like `$inc` for counter updates whenever possible.
