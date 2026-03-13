## 2025-01-24 - User Controller Optimization
**Learning:** `isAuthenticatedUser` middleware already fetches and attaches the full user document to `req.user`. Subsequent controllers like `getUserDetails` often re-fetch the user from the DB using `req.user.id`, which is a redundant operation.
**Action:** In controllers following authentication middleware, check if `req.user` already contains the necessary data before making another DB call.

## 2024-03-13 - Optimize order stock verification
**Learning:** Nested array searches (`Array.prototype.find()` inside a `for` loop) can create severe performance bottlenecks with an O(N*M) time complexity, especially when validating large datasets like order items against inventory products.
**Action:** Always refactor O(N*M) validation loops by mapping the target array into a `Map` or Hash table first, reducing the complexity to O(N+M) and providing O(1) lookups during the iteration loop.
