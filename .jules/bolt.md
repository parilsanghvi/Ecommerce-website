## 2025-01-24 - User Controller Optimization
**Learning:** `isAuthenticatedUser` middleware already fetches and attaches the full user document to `req.user`. Subsequent controllers like `getUserDetails` often re-fetch the user from the DB using `req.user.id`, which is a redundant operation.
**Action:** In controllers following authentication middleware, check if `req.user` already contains the necessary data before making another DB call.

## 2026-02-03 - Atomic Stock Updates
**Learning:** Updating inventory using `findById` -> modify -> `save` is inefficient (2 DB calls) and prone to race conditions. MongoDB's `$inc` operator is atomic and faster.
**Action:** Always prefer `updateOne` with atomic operators like `$inc` for simple numeric updates instead of fetching and saving.
