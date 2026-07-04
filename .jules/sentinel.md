## 2024-05-19 - Information Disclosure via Default Error Handler
**Vulnerability:** The default error-handling middleware (`backend/middleware/error.js`) fell back to assigning `err.message = err.message || "internal server error"` when wrapping custom exceptions and Mongoose errors, passing these unchecked errors directly to the client via `res.status(err.statusCode).json({ message: err.message })`.
**Learning:** Any untrapped 500 error originating from third-party libraries, database drivers (like Mongoose outside of specific Cast/Validation errors), or system functions would directly stream their internal message payloads to the client, even in production environments (`NODE_ENV === 'production'`), exposing system architecture, file paths, or potentially sensitive internal data.
**Prevention:** Implement explicit environment checks inside top-level error middleware. If `process.env.NODE_ENV === 'PRODUCTION' || 'production'`, forcefully overwrite any `err.statusCode === 500` error payloads with a generic `"Internal Server Error"` string to guarantee defensive obfuscation of system details from end-users while allowing 4xx validation errors to remain intact.
## 2024-05-24 - Rate Limiter Bypass via IP Spoofing
**Vulnerability:** The Express application was unconditionally trusting the reverse proxy using `app.set('trust proxy', 1);`. If the application were exposed directly to the internet without a trusted proxy, an attacker could supply a malicious `X-Forwarded-For` HTTP header, spoofing their IP address to bypass the configured `express-rate-limit` middleware or any IP-based banning.
**Learning:** Hardcoding `trust proxy` makes the application insecure by default in direct-facing deployments. Security-critical configuration that depends on the infrastructure deployment topology should be configurable via environment variables rather than hardcoded.
**Prevention:** Make the `trust proxy` setting conditional on an environment variable, such as `process.env.TRUST_PROXY === 'true'`, ensuring that the application fails securely and only trusts proxy headers when explicitly configured by the infrastructure operator.

## 2024-06-06 - Denial of Service via Unbounded Arrays in Payment Process
**Vulnerability:** The `processPayment` controller endpoint failed to check the upper bounds of the `items` array parameter before mapping over it to collect product IDs, fetching data, and looping through it sequentially for calculation (`backend/controllers/paymentController.js`).
**Learning:** Accepting arrays of arbitrary sizes in request payloads from unauthenticated or authenticated users opens up the endpoint to Denial of Service (DoS) attacks. An attacker could craft a payload with an enormous number of elements, causing synchronous loops or excessive database operations to consume all available memory and block the event loop, bringing down the service.
**Prevention:** Always enforce a strict maximum length on arrays parsed from the request body or query string, particularly when array elements are mapped to database operations or iterations. Ensure an appropriate fallback validation is implemented directly within controllers to preempt massive loads (e.g., `if (items.length > 100)`).

## 2025-02-18 - Host Header Injection in Password Reset
**Learning:** Hardcoding or reflecting the `Host` header from incoming HTTP requests (`req.get('host')`) to construct password reset links is dangerous. An attacker can craft a malicious HTTP request with a spoofed `Host` header (e.g., `Host: evil.com`), causing the backend to generate and email a reset link pointing to the attacker's domain, leading to token theft.
**Action:** Always enforce the use of a statically configured environment variable (like `process.env.FRONTEND_URL`) to build sensitive absolute URLs (such as password reset links or OAuth callbacks) instead of dynamically deriving the host from client-controlled headers.

## 2024-05-20 - Mass Assignment Vulnerability Prevention
**Vulnerability:** Updating documents using unmodified request bodies (e.g. `req.body`) can allow attackers to overwrite protected fields by supplying unexpected key-value pairs in the payload.
**Learning:** Mass assignment vulnerabilities occur when user input is blindly applied to models.
**Action:** Always filter `req.body` using an explicit allowlist (e.g., `['name', 'price', 'description', 'category', 'stock']`) before updating documents, or use strict schema definitions, ensuring fields like user IDs or internal state flags cannot be maliciously altered.

## 2025-02-28 - Denial of Service via Unbounded Arrays in Order Processing
**Vulnerability:** The `newOrder` controller endpoint directly invoked `map` over the `orderItems` payload without verifying its type or bounding its size, exposing the endpoint to potential Denial of Service (DoS) and unhandled TypeErrors.
**Learning:** Accepting unbounded arrays in order processing allows attackers to send massive payloads that can exhaust system memory, block the Node.js event loop during iteration, or trigger crashes if the property is incorrectly typed (e.g. as a string or object without a `.map` method). This was analogous to a similar vulnerability previously found in the payment process.
**Prevention:** Strictly validate incoming array payloads (`Array.isArray()`) and enforce sensible length limits (`array.length > 100`) at the top of the controller function before performing iterative operations or database lookups.

## 2024-06-13 - Security False Positives via Code Comments
**Vulnerability:** Comments containing markers like `Security Fix:` or `TODO:` may lead automated static analysis tools to incorrectly flag resolved issues as active, producing false positives.
**Learning:** Hardcoding trigger words within comments meant purely for descriptive purposes can clutter issue trackers and degrade the signal-to-noise ratio of automated security tooling.
**Prevention:** When documenting the rationale for security-sensitive logic (e.g., clearing sensitive data), describe the action generically (e.g., `Prevent leaking...`) without explicit "Fix" markers that resemble unresolved task patterns.

## 2024-07-04 - Fix NoSQL Injection in Login
**Learning:** Type confusion NoSQL injection occurs when user input like an email is unexpectedly parsed as an object (e.g. `{ "$ne": null }`) instead of a string, bypassing authentication if passed directly to database queries.
**Action:** Always strictly enforce type checking (e.g., `typeof email === 'string'`) on parameters passed directly into MongoDB query objects, especially authentication endpoints, even when global sanitizers are present to provide defense in depth.
