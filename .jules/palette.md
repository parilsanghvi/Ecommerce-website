## 2024-05-14 - Replace input buttons with `<button>` tags for Async operations
**Learning:** Using `<input type="submit">` for important asynchronous actions (like payment processing) prevents the inclusion of visual feedback elements like inline spinners (`CircularProgress`). This leads to a poor user experience as the user is unsure if their action registered, and can cause anxiety during sensitive operations like payments.
**Action:** When creating forms that trigger long-running asynchronous tasks, always use a `<button type="submit">` with an internal state (like `isProcessing`) to conditionally render an inline loading indicator and disable the button, providing immediate and clear feedback to the user.

## 2024-03-06 - Add ARIA label to 'X' icon buttons
**Learning:** Text closures like 'X' are ambiguous for screen readers and must be equipped with descriptive `aria-label` attributes to support proper screen reader functionality.
**Action:** Always add an `aria-label` to visually-driven interactive elements or ambiguous text closures.
## 2024-06-25 - [UX Improvement] Add Password Toggle to Reset Password Form
**Learning:** Form inputs that obscure user text (passwords) can frequently lead to frustration during a reset flow if they are not correctly keyed, resulting in mismatched confirm passwords and errors. We should provide a way for the user to view the value they are typing. We also had to fix an accessibility bug where the toggle button's `aria-label` incorrectly provided screen reader visibility status of the input content, rather than communicating the purpose of the interactive button (i.e. 'Show password'/'Hide password').
**Action:** When adding password inputs, especially to reset forms without previous context, provide a 'Show/Hide Password' toggle. Ensure `aria-label` communicates the purpose of the button to visually impaired users (e.g., `aria-label={showPassword ? 'Hide password' : 'Show password'}`).
