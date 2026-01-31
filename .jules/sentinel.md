## 2025-02-19 - Product Rating Integrity Vulnerability
**Vulnerability:** The `createProductReview` controller used `validateBeforeSave: false` to avoid re-validating the entire product document when adding a review. However, this also bypassed validation for the *new* review data, allowing users to submit ratings outside the valid range (e.g., 100).
**Learning:** Bypassing Mongoose validation via `validateBeforeSave: false` is risky and must be accompanied by manual validation of any new data being inserted. Additionally, the `catchAsyncErrors` middleware wraps async controllers but does not return the promise, which makes direct unit testing of controllers difficult unless the middleware is mocked to return the promise.
**Prevention:**
1. Always implement explicit input validation in the controller layer (fail fast), especially when using `validateBeforeSave: false`.
2. Add schema-level validation (min/max) as defense-in-depth.
3. When testing controllers wrapped in `catchAsyncErrors`, mock the middleware to return the execution promise to ensure the test waits for completion.

## 2025-02-19 - Inventory Race Condition & Silent Failure
**Vulnerability:** The `updateStock` function used a `findById` -> `subtract` -> `save` pattern, which is susceptible to race conditions (two requests reading the same stock). A proposed fix using `updateOne` with `$inc` and `$gte` (to prevent negative stock) introduced a silent failure: if stock was insufficient, `updateOne` returned `modifiedCount: 0`, but the code proceeded to mark the order as "Shipped".
**Learning:** Atomic updates with conditions (like `{ stock: { $gte: quantity } }`) fail "silently" if the condition isn't met (i.e., they don't throw, they just don't modify anything).
**Prevention:**
1. Always check `result.modifiedCount` (or `nModified`) after an atomic update operation with conditions.
2. Explicitly throw an error if `modifiedCount === 0` to ensure the operation (e.g., order status update) fails if the dependency (stock deduction) failed.
