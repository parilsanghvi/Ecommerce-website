## 2025-02-19 - Product Rating Integrity Vulnerability
**Vulnerability:** The `createProductReview` controller used `validateBeforeSave: false` to avoid re-validating the entire product document when adding a review. However, this also bypassed validation for the *new* review data, allowing users to submit ratings outside the valid range (e.g., 100).
**Learning:** Bypassing Mongoose validation via `validateBeforeSave: false` is risky and must be accompanied by manual validation of any new data being inserted. Additionally, the `catchAsyncErrors` middleware wraps async controllers but does not return the promise, which makes direct unit testing of controllers difficult unless the middleware is mocked to return the promise.
**Prevention:**
1. Always implement explicit input validation in the controller layer (fail fast), especially when using `validateBeforeSave: false`.
2. Add schema-level validation (min/max) as defense-in-depth.
3. When testing controllers wrapped in `catchAsyncErrors`, mock the middleware to return the execution promise to ensure the test waits for completion.

## 2025-02-21 - Mongoose Middleware Race Condition
**Vulnerability:** A `pre('save')` hook in `userModel.js` was defined as `async function (next)` but called `next()` without returning (`if (!modified) { next(); }`). This caused the function to continue executing the password hashing logic while Mongoose had already proceeded, leading to race conditions and "next is not a function" errors during error handling.
**Learning:** When using `async/await` in Mongoose middleware, mixing callbacks (`next`) with async logic is error-prone. Calling `next()` does not stop the execution of the async function.
**Prevention:**
1. Prefer returning Promises (async/await) in Mongoose middleware and avoid using the `next` parameter entirely if possible.
2. If `next` is used, always `return next()` to ensure the function exits immediately.
