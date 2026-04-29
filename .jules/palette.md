## 2024-05-14 - Replace input buttons with `<button>` tags for Async operations
**Learning:** Using `<input type="submit">` for important asynchronous actions (like payment processing) prevents the inclusion of visual feedback elements like inline spinners (`CircularProgress`). This leads to a poor user experience as the user is unsure if their action registered, and can cause anxiety during sensitive operations like payments.
**Action:** When creating forms that trigger long-running asynchronous tasks, always use a `<button type="submit">` with an internal state (like `isProcessing`) to conditionally render an inline loading indicator and disable the button, providing immediate and clear feedback to the user.

## 2024-03-06 - Add ARIA label to 'X' icon buttons
**Learning:** Text closures like 'X' are ambiguous for screen readers and must be equipped with descriptive `aria-label` attributes to support proper screen reader functionality.
**Action:** Always add an `aria-label` to visually-driven interactive elements or ambiguous text closures.
## 2024-05-14 - Add ARIA label and visibility toggle for password fields
**Learning:** Security fields like passwords often obscure user inputs by default, but hiding password input without a way to reveal it causes significant usability issues (typos, form abandonment). Screen reader users also require appropriate descriptive context via `aria-label` for these icon-only toggles.
**Action:** Always provide an explicit "show/hide password" toggle for all password input fields in authentication or reset workflows. Additionally, strictly apply dynamic `aria-label`s to the toggle buttons to ensure the state ("Show password" vs "Hide password") is cleanly announced to assistive technologies.
