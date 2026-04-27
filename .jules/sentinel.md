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

## 2025-02-19 - Inventory Race Condition & Silent Failure
**Vulnerability:** The `updateStock` function used a `findById` -> `subtract` -> `save` pattern, which is susceptible to race conditions (two requests reading the same stock). A proposed fix using `updateOne` with `$inc` and `$gte` (to prevent negative stock) introduced a silent failure: if stock was insufficient, `updateOne` returned `modifiedCount: 0`, but the code proceeded to mark the order as "Shipped".
**Learning:** Atomic updates with conditions (like `{ stock: { $gte: quantity } }`) fail "silently" if the condition isn't met (i.e., they don't throw, they just don't modify anything).
**Prevention:**
1. Always check `result.modifiedCount` (or `nModified`) after an atomic update operation with conditions.
2. Explicitly throw an error if `modifiedCount === 0` to ensure the operation (e.g., order status update) fails if the dependency (stock deduction) failed.

## 2025-02-20 - Payment Amount Tampering Vulnerability
**Vulnerability:** The `processPayment` controller trusted the `amount` field sent by the client in the request body to create a Stripe PaymentIntent. This allowed malicious users to pay an arbitrary small amount for an order.
**Learning:** Never trust client-side calculations for payment amounts. The backend must always recalculate the total based on the items and their current prices in the database.
**Prevention:**
1. In payment processing logic, receive the list of items (IDs and quantities) instead of the total amount.
2. Fetch the product details from the database and calculate the total amount server-side.
3. Use this server-side calculated amount for payment gateway interactions.

## 2025-02-25 - Stored XSS in Product Reviews
**Vulnerability:** The `createProductReview` controller stored user-submitted comments directly into the database without sanitization. This allowed attackers to inject malicious scripts (Stored XSS) that would execute when other users viewed the product page.
**Learning:** While frontend frameworks (like React) often escape output by default, relying solely on them is insufficient (defense in depth). Raw data might be consumed by other clients (mobile apps, admin dashboards, emails) that don't auto-escape.
**Prevention:**
1. Sanitize user input on the server side before storage, especially for rich text or free-form fields.
2. Use a dedicated sanitization library (like `dompurify` or `validator`) or, for simple cases, a strict allowlist/regex stripper.
3. Always implement input validation and sanitization at the API boundary.

## 2024-05-24 - Updated Multer Dependency for DoS Vulnerability
**Vulnerability:** Denial of Service via incomplete cleanup/resource exhaustion in `multer` package.
**Learning:** `multer` < 2.1.0 can be exploited to cause DoS by sending specifically crafted payloads that lead to uncleaned temporary files or infinite processing.
**Prevention:** Keep multipart-parsing dependencies up-to-date and monitor security advisories for packages handling file uploads.

## 2025-02-27 - Negative Quantity Business Logic Flaw
**Vulnerability:** The `processPayment` and `newOrder` endpoints calculated the total order price by iterating through items and adding `product.price * item.quantity`. The `item.quantity` parameter from the client payload was not strictly validated as a positive integer. This allowed attackers to submit negative quantities (e.g., `-100`), which could offset the price of other expensive items, resulting in a total price manipulation or effectively a zero/negative total order amount.
**Learning:** Any input from the client that directly affects financial math or stock adjustments must be strictly validated. Relying only on Mongoose schemas isn't enough if the field lacks explicit minimum constraints or is processed before saving.
**Prevention:**
1. Explicitly check that numerical inputs affecting business logic (like quantities) are strictly valid integers using `Number.isInteger(val) && val >= 1`.
2. Fail fast with an appropriate `400 Bad Request` explicitly stating the invalid input.
## 2025-02-18 - [Fix Prototype NoSQL Injection Bypass]
**Vulnerability:** The NoSQL injection sanitizer in `backend/middleware/mongoSanitize.js` used `obj instanceof Object`, which failed to identify and sanitize objects with a `null` prototype (e.g., `Object.create(null)` or those generated by Express's `extended` query parser via the `qs` library).
**Learning:** Checking object types strictly using prototypes can be bypassed by request body/query parsers that create null-prototype objects.
**Prevention:** Always use `typeof obj === 'object' && obj !== null` to securely identify JavaScript objects for sanitization.

## 2025-02-28 - Insecure File Upload Configuration
**Vulnerability:** The `createProduct` and `updateProduct` routes in `backend/routes/productRoute.js` used the `upload.any()` middleware from Multer. This configuration allows the server to accept files from any field name in a multipart/form-data request, significantly increasing the attack surface. An attacker could potentially upload malicious files (e.g., scripts) masquerading as harmless fields or exhaust server resources by uploading unexpected files.
**Learning:** Using `upload.any()` is dangerous as it bypasses field-level validation and allows arbitrary file uploads.
**Prevention:**
1. Always explicitly define the expected file fields and their acceptable quantities using methods like `upload.single('fieldname')`, `upload.array('fieldname', maxCount)`, or `upload.fields([{ name: 'field1', maxCount: 1 }])`.
2. Restrict allowed file types and sizes within the Multer configuration.
3. Validate uploaded file content (e.g., using magic numbers) to ensure they match their declared MIME types.
