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

## 2026-02-11 - Missing Trust Proxy Configuration
**Vulnerability:** Rate limiting implementation would fail (ban load balancer IP) on platforms like Render because `app.set('trust proxy', 1)` was missing, causing all requests to appear as coming from the internal load balancer.
**Learning:** When implementing IP-based security controls (rate limiting), always verify that the application correctly resolves client IPs in its deployment environment (e.g., behind proxies). Documentation or memory might be outdated.
**Prevention:** Explicitly configure `trust proxy` settings in Express applications destined for PaaS deployment, or use a library that forces you to configure it.
