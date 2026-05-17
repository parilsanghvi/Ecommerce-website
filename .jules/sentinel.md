## 2025-05-16 - Insecure Logout Cookie Flags
**Vulnerability:** The logout controller cleared the JWT cookie by setting it to null, but omitted the `secure` and `sameSite` flags that were originally set when the cookie was created during login.
**Learning:** Even when clearing a cookie (setting value to null and expiring it), the response must include the same `secure` and `sameSite` flags to ensure the browser processes the operation with the correct security context, especially preventing interception over unencrypted connections.
**Prevention:** Ensure that all `res.cookie` operations (both creation and deletion) consistently apply security flags (`httpOnly`, `secure`, `sameSite`).
