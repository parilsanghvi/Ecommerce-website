# Sentinel's Journal

## 2025-02-14 - Critical Auth Middleware Flaw
**Vulnerability:** Found `backend/middleware/auth.js` containing debug code that bypassed security checks and crashed on missing tokens. Specifically: `if (hello == 6)` and `await req.cookies`.
**Learning:** Even simple middleware can have critical flaws if debug code is left in. "Typos" in directory names (`utlis` instead of `utils`) are prevalent and must be respected.
**Prevention:** Always check middleware logic for debug remnants. Verify variable existence before accessing properties.

## 2025-02-15 - Password Reset Expiration Bypass
**Vulnerability:** The password reset token expiration was failing because `Date.now` (function) was used instead of `Date.now()` (timestamp) in `userModel.js`, resulting in `undefined` expiration dates. Consequently, the expiration check in `userController.js` was commented out, allowing tokens to be used indefinitely.
**Learning:** Typos in critical security logic (like missing parentheses) can lead to complete security failures. Commented-out security checks are a major red flag indicating underlying broken logic.
**Prevention:** Use TypeScript or linting rules that catch arithmetic operations on functions. Always investigate *why* a security check is commented out rather than ignoring it.

## 2025-02-15 - Broken Logout Functionality
**Vulnerability:** The `logout` function in `userController.js` used `expires: new Date(Date.now)` (function) instead of `Date.now()` (timestamp). This resulted in an `Invalid Date` for the cookie expiration, potentially causing the logout to fail or behave unpredictably across browsers.
**Learning:** The pattern of missing parentheses for `Date.now()` appeared multiple times in the codebase, suggesting a copy-paste error or systemic misunderstanding.
**Prevention:** Add a linting rule or manual check for `new Date(Date.now)` vs `new Date(Date.now())`. Verify cookie attributes in tests.

## 2025-02-15 - Login Authentication Bypass via Control Flow
**Vulnerability:** The `loginUser` controller failed to `return` after calling `next(error)` when a password mismatch occurred. This allowed execution to proceed to `sendToken`, logging the user in despite an invalid password. Additionally, status codes were passed to `next()` instead of the `ErrorHandler` constructor, causing errors to potentially default to 500.
**Learning:** Missing `return` statements in Express middleware/controllers are a silent but deadly pattern that can completely negate authentication checks.
**Prevention:** Enforce consistent use of `return next(err)` pattern. Use linting rules (e.g., `eslint-plugin-express`) that detect code execution after `next(err)`.

## 2025-02-18 - Host Header Injection in Password Reset
**Vulnerability:** The `forgotPassword` controller used `req.get("host")` to construct the password reset link. This allows an attacker to inject a malicious Host header, potentially causing the victim to receive a reset link pointing to an attacker-controlled domain.
**Learning:** Trusting `Host` header for generating absolute URLs is insecure, especially for sensitive actions like password resets.
**Prevention:** Always use a trusted server-side configuration variable (like `FRONTEND_URL`) to construct absolute URLs. Implement a fallback only if strictly necessary and understood.

## 2025-02-18 - Deleted User Authentication Bypass
**Vulnerability:** `isAuthenticatedUser` retrieved the user by ID but failed to check if the result was `null`. This allowed deleted users with valid tokens to bypass the first layer of authentication, potentially causing 500 errors in subsequent middleware or returning 200 OK with `null` user data.
**Learning:** `Model.findById()` returns `null` (success) if not found, not an error. Authentication middleware must explicitly check for existence.
**Prevention:** Always check `if (!user)` after database retrieval in auth middleware.
