## 2024-05-14 - Replace input buttons with `<button>` tags for Async operations
**Learning:** Using `<input type="submit">` for important asynchronous actions (like payment processing) prevents the inclusion of visual feedback elements like inline spinners (`CircularProgress`). This leads to a poor user experience as the user is unsure if their action registered, and can cause anxiety during sensitive operations like payments.
**Action:** When creating forms that trigger long-running asynchronous tasks, always use a `<button type="submit">` with an internal state (like `isProcessing`) to conditionally render an inline loading indicator and disable the button, providing immediate and clear feedback to the user.

## 2024-03-06 - Add ARIA label to 'X' icon buttons
**Learning:** Text closures like 'X' are ambiguous for screen readers and must be equipped with descriptive `aria-label` attributes to support proper screen reader functionality.
**Action:** Always add an `aria-label` to visually-driven interactive elements or ambiguous text closures.
## 2026-04-28 - Add password visibility toggle to ResetPassword form
**Learning:** Adding interactive elements (like visibility toggles) into standard form fields requires explicitly wrapping them in a semantic `<button type="button">` element and managing their absolute positioning securely within a `position: relative` wrapper, ensuring padding on the input avoids overlap.
**Action:** Always include a show/hide password feature for password inputs across all authentication forms (e.g., login, signup, reset password) to prevent users from getting locked out due to unseen typos, and consistently style them using shared classes like `.password-toggle-btn`.
