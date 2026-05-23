## 2024-05-14 - Replace input buttons with `<button>` tags for Async operations
**Learning:** Using `<input type="submit">` for important asynchronous actions (like payment processing) prevents the inclusion of visual feedback elements like inline spinners (`CircularProgress`). This leads to a poor user experience as the user is unsure if their action registered, and can cause anxiety during sensitive operations like payments.
**Action:** When creating forms that trigger long-running asynchronous tasks, always use a `<button type="submit">` with an internal state (like `isProcessing`) to conditionally render an inline loading indicator and disable the button, providing immediate and clear feedback to the user.

## 2024-03-06 - Add ARIA label to 'X' icon buttons
**Learning:** Text closures like 'X' are ambiguous for screen readers and must be equipped with descriptive `aria-label` attributes to support proper screen reader functionality.
**Action:** Always add an `aria-label` to visually-driven interactive elements or ambiguous text closures.

## 2024-05-23 - Add accessible alert roles to dynamic form errors
**Learning:** Dynamic inline validation error messages (like 'File is too large' or 'Invalid credentials') that appear after an action are not automatically announced by screen readers. Furthermore, decorative icons accompanying the text (like `MdErrorOutline`) can be read out generically, creating noise for users.
**Action:** Always wrap dynamic error messages in a container with `role="alert"` and `aria-live="assertive"` to force immediate screen reader announcement. Additionally, explicitly add `aria-hidden="true"` to any decorative icons within the error container to prevent redundant or confusing audio feedback.