## 2024-05-14 - Replace input buttons with `<button>` tags for Async operations
**Learning:** Using `<input type="submit">` for important asynchronous actions (like payment processing) prevents the inclusion of visual feedback elements like inline spinners (`CircularProgress`). This leads to a poor user experience as the user is unsure if their action registered, and can cause anxiety during sensitive operations like payments.
**Action:** When creating forms that trigger long-running asynchronous tasks, always use a `<button type="submit">` with an internal state (like `isProcessing`) to conditionally render an inline loading indicator and disable the button, providing immediate and clear feedback to the user.

## 2024-05-18 - Password Input Accessibility
**Learning:** Icon-only toggle buttons for hiding/showing passwords often lack accessible names, making them difficult to use with screen readers. Providing dynamic `aria-label` attributes (e.g., "Show password" vs. "Hide password") based on the current state significantly improves form accessibility.
**Action:** Always ensure interactive elements like password visibility toggles have clear, dynamic accessible names via `aria-label` or visually hidden text to communicate their current function and state.
