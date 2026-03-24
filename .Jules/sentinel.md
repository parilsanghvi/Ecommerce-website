## 2025-02-19 - Product Rating Integrity Vulnerability
**Vulnerability:** The `createProductReview` controller used `validateBeforeSave: false` to avoid re-validating the entire product document when adding a review. However, this also bypassed validation for the *new* review data, allowing users to submit ratings outside the valid range (e.g., 100).
**Learning:** Bypassing Mongoose validation via `validateBeforeSave: false` is risky and must be accompanied by manual validation of any new data being inserted. Additionally, the `catchAsyncErrors` middleware wraps async controllers but does not return the promise, which makes direct unit testing of controllers difficult unless the middleware is mocked to return the promise.
**Prevention:**
1. Always implement explicit input validation in the controller layer (fail fast), especially when using `validateBeforeSave: false`.
2. Add schema-level validation (min/max) as defense-in-depth.
3. When testing controllers wrapped in `catchAsyncErrors`, mock the middleware to return the execution promise to ensure the test waits for completion.
## 2024-03-12 - Password Hash Leak in API Responses
**Vulnerability:** The hashed user password was leaked in the JSON response of `loginUser` and `updatePassword`.
**Learning:** Explicitly selecting a schema-excluded field via Mongoose (e.g., `select("+password")` for validation purposes) overrides the schema definition and causes the field to be serialized in the final `res.json()` payload unless explicitly removed.
**Prevention:** Always strip sensitive fields explicitly (e.g., `user.password = undefined;`) before returning or passing a Mongoose document containing explicitly selected sensitive data to a response utility.
