## 2024-05-14 - Replace input buttons with `<button>` tags for Async operations
**Learning:** Using `<input type="submit">` for important asynchronous actions (like payment processing) prevents the inclusion of visual feedback elements like inline spinners (`CircularProgress`). This leads to a poor user experience as the user is unsure if their action registered, and can cause anxiety during sensitive operations like payments.
**Action:** When creating forms that trigger long-running asynchronous tasks, always use a `<button type="submit">` with an internal state (like `isProcessing`) to conditionally render an inline loading indicator and disable the button, providing immediate and clear feedback to the user.

## 2024-03-06 - Add ARIA label to 'X' icon buttons
**Learning:** Text closures like 'X' are ambiguous for screen readers and must be equipped with descriptive `aria-label` attributes to support proper screen reader functionality.
**Action:** Always add an `aria-label` to visually-driven interactive elements or ambiguous text closures.
## 2024-05-15 - Password Visibility Toggles in Authentication Forms
**Learning:** Icon-only toggles (like show/hide password buttons) must have dynamic `aria-label` attributes reflecting their current state (e.g., "Show password" vs "Hide password") to ensure the state is clearly announced to assistive technologies. Additionally, using `pointer-events: none` on the decorative icons within input fields prevents them from blocking clicks when adding interactive elements.
**Action:** Always provide password visibility toggles with dynamic `aria-labels` for all authentication form password inputs (login, register, update password, reset password) to prevent users from getting locked out due to unseen typos, and ensure icons do not block the input fields.
## 2024-05-15 - React Practice (Refs): Async Callbacks
**Learning:** When mutating properties of a `useRef` element (e.g., `ref.current.disabled = false`) inside asynchronous callbacks (like `catch` blocks after API calls), the component might have unmounted before the promise resolves, causing a `TypeError: Cannot set properties of null`.
**Action:** Always verify the reference exists first (`if (ref.current)`) before mutating it.
