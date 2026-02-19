## 2025-02-19 - Product Rating Integrity Vulnerability
**Vulnerability:** The `createProductReview` controller used `validateBeforeSave: false` to avoid re-validating the entire product document when adding a review. However, this also bypassed validation for the *new* review data, allowing users to submit ratings outside the valid range (e.g., 100).
**Learning:** Bypassing Mongoose validation via `validateBeforeSave: false` is risky and must be accompanied by manual validation of any new data being inserted. Additionally, the `catchAsyncErrors` middleware wraps async controllers but does not return the promise, which makes direct unit testing of controllers difficult unless the middleware is mocked to return the promise.
**Prevention:**
1. Always implement explicit input validation in the controller layer (fail fast), especially when using `validateBeforeSave: false`.
2. Add schema-level validation (min/max) as defense-in-depth.
3. When testing controllers wrapped in `catchAsyncErrors`, mock the middleware to return the execution promise to ensure the test waits for completion.

## 2025-02-19 - Order Price Tampering Vulnerability
**Vulnerability:** The `newOrder` controller blindly accepted `itemsPrice` from the request body without verification. This allowed attackers to manipulate the price of an order (e.g., setting it to 1) while purchasing expensive items.
**Learning:** Never trust client-side calculations for critical financial data like prices. The backend must always act as the source of truth. Additionally, `MongoMemoryServer` is unstable in this environment (`SIGSEGV`), necessitating the use of Jest mocks for reliable security testing.
**Prevention:**
1. In order creation logic, always fetch product prices from the database and recalculate the total on the server side.
2. Reject requests where the client-provided price deviates from the server-calculated price (allowing for small floating-point margins).
3. Use Jest mocks for Mongoose models (`Product`, `Order`) when writing unit tests to avoid environment-related crashes.

## 2025-02-19 - Missing Input Validation on Forgot/Reset Password
**Vulnerability:** The `forgotPassword` and `resetPassword` endpoints lacked input validation at the route level. This allowed invalid emails or password formats to reach the controller logic, potentially causing unexpected behavior or unnecessary database lookups.
**Learning:** Even though the controller logic might handle missing users or mismatched passwords, validation at the boundary (middleware) is critical for security best practices (Fail Fast). `zod` schemas were available but not applied to these specific routes.
**Prevention:**
1. Always apply validation middleware to all public-facing routes, especially authentication-related ones.
2. Ensure consistent use of `zod` schemas for all request bodies.
3. Verify that new routes are added with appropriate validation middleware.

## 2025-02-19 - IDOR in Order Details
**Vulnerability:** The `getSingleOrder` endpoint fetched an order by ID but failed to verify if the authenticated user was the owner of that order. This allowed any authenticated user to access any other user's order details by guessing the order ID.
**Learning:** Authentication is not Authorization. Even if a user is logged in (`isAuthenticatedUser`), they must only be allowed to access resources they own or have permission to view.
**Prevention:**
1. Always implement resource ownership checks in controllers for "get by ID" endpoints.
2. Use a centralized authorization policy or middleware if possible.
3. When unit testing controllers with `catchAsyncErrors`, mock the middleware to return the promise to ensure tests wait for async operations.

## 2025-02-20 - Payment Amount Tampering Vulnerability
**Vulnerability:** The `processPayment` controller trusted the `amount` field sent by the client in the request body to create a Stripe PaymentIntent. This allowed malicious users to pay an arbitrary small amount for an order.
**Learning:** Never trust client-side calculations for payment amounts. The backend must always recalculate the total based on the items and their current prices in the database.
**Prevention:**
1. In payment processing logic, receive the list of items (IDs and quantities) instead of the total amount.
2. Fetch the product details from the database and calculate the total amount server-side.
3. Use this server-side calculated amount for payment gateway interactions.
