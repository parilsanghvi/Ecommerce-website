## 2025-02-19 - Product Rating Integrity Vulnerability
**Vulnerability:** The `createProductReview` controller used `validateBeforeSave: false` to avoid re-validating the entire product document when adding a review. However, this also bypassed validation for the *new* review data, allowing users to submit ratings outside the valid range (e.g., 100).
**Learning:** Bypassing Mongoose validation via `validateBeforeSave: false` is risky and must be accompanied by manual validation of any new data being inserted. Additionally, the `catchAsyncErrors` middleware wraps async controllers but does not return the promise, which makes direct unit testing of controllers difficult unless the middleware is mocked to return the promise.
**Prevention:**
1. Always implement explicit input validation in the controller layer (fail fast), especially when using `validateBeforeSave: false`.
2. Add schema-level validation (min/max) as defense-in-depth.
3. When testing controllers wrapped in `catchAsyncErrors`, mock the middleware to return the execution promise to ensure the test waits for completion.

## 2025-03-13 - Password Hash Leak in Auth Responses
**Vulnerability:** The authentication controllers (`registerUser`, `loginUser`, `resetPassword`, `updatePassword`) returned the `user` document in the JSON response payload. Because Mongoose returns the `.password` field either upon creation or when explicitly requested via `.select("+password")`, the hashed password was leaked to the frontend/client.
**Learning:** Always manually strip sensitive fields (e.g. `user.password = undefined;`) from Mongoose documents prior to serializing them in the response (`res.json()`), particularly when those fields were explicitly requested for internal use (like password comparison).
**Prevention:** Sanitize the response payload directly before passing it to utility functions like `sendToken()`, or configure Mongoose schemas specifically using options like `toJSON: { transform: (doc, ret) => { delete ret.password; return ret; } }`.
