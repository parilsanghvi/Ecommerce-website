# Sentinel's Journal

## 2025-02-14 - Critical Auth Middleware Flaw
**Vulnerability:** Found `backend/middleware/auth.js` containing debug code that bypassed security checks and crashed on missing tokens. Specifically: `if (hello == 6)` and `await req.cookies`.
**Learning:** Even simple middleware can have critical flaws if debug code is left in. "Typos" in directory names (`utlis` instead of `utils`) are prevalent and must be respected.
**Prevention:** Always check middleware logic for debug remnants. Verify variable existence before accessing properties.
