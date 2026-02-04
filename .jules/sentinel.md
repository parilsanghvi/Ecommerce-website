## 2025-02-19 - Product Rating Integrity Vulnerability
**Vulnerability:** The `createProductReview` controller used `validateBeforeSave: false` to avoid re-validating the entire product document when adding a review. However, this also bypassed validation for the *new* review data, allowing users to submit ratings outside the valid range (e.g., 100).
**Learning:** Bypassing Mongoose validation via `validateBeforeSave: false` is risky and must be accompanied by manual validation of any new data being inserted. Additionally, the `catchAsyncErrors` middleware wraps async controllers but does not return the promise, which makes direct unit testing of controllers difficult unless the middleware is mocked to return the promise.
**Prevention:**
1. Always implement explicit input validation in the controller layer (fail fast), especially when using `validateBeforeSave: false`.
2. Add schema-level validation (min/max) as defense-in-depth.
3. When testing controllers wrapped in `catchAsyncErrors`, mock the middleware to return the execution promise to ensure the test waits for completion.

## 2025-02-19 - Account Enumeration in Forgot Password
**Vulnerability:** The `forgotPassword` endpoint returned a specific 404 "user not found" error when an email did not exist. This allowed attackers to enumerate valid email addresses registered in the system.
**Learning:** Returning specific error messages for authentication/recovery flows leaks information. Also, Mongoose pre-save hooks using `async/await` should not accept/call `next()` to avoid "next is not a function" errors in newer Mongoose versions/environments, which surfaced during testing.
**Prevention:**
1. Always use generic success messages for password recovery (e.g., "If the email exists, we sent a link").
2. Ensure the response time is somewhat consistent (though complete timing attack mitigation requires more effort like dummy hashing).
3. Use `async function()` without `next` for Mongoose pre-hooks when using await.
