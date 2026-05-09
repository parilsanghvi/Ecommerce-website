## 2024-05-14 - Replace input buttons with `<button>` tags for Async operations
**Learning:** Using `<input type="submit">` for important asynchronous actions (like payment processing) prevents the inclusion of visual feedback elements like inline spinners (`CircularProgress`). This leads to a poor user experience as the user is unsure if their action registered, and can cause anxiety during sensitive operations like payments.
**Action:** When creating forms that trigger long-running asynchronous tasks, always use a `<button type="submit">` with an internal state (like `isProcessing`) to conditionally render an inline loading indicator and disable the button, providing immediate and clear feedback to the user.

## 2024-03-06 - Add ARIA label to 'X' icon buttons
**Learning:** Text closures like 'X' are ambiguous for screen readers and must be equipped with descriptive `aria-label` attributes to support proper screen reader functionality.
**Action:** Always add an `aria-label` to visually-driven interactive elements or ambiguous text closures.

## 2024-05-18 - Add password visibility toggles to authentication forms
**Learning:** Authentication forms with multiple password fields (like Reset Password or Update Password) frequently omit visibility toggles for the secondary fields (e.g., "Confirm Password"), forcing users to guess if they made a typo. This is particularly problematic for users relying on screen readers or those with cognitive disabilities.
**Action:** Always provide functional password visibility toggles (with clear `aria-label`s) for *all* password inputs within a form, not just the primary one, to ensure a consistent and accessible user experience. Ensure they are styled appropriately and do not overlap with the input text.
