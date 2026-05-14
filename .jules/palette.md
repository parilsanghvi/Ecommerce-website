## 2024-05-14 - Replace input buttons with `<button>` tags for Async operations
**Learning:** Using `<input type="submit">` for important asynchronous actions (like payment processing) prevents the inclusion of visual feedback elements like inline spinners (`CircularProgress`). This leads to a poor user experience as the user is unsure if their action registered, and can cause anxiety during sensitive operations like payments.
**Action:** When creating forms that trigger long-running asynchronous tasks, always use a `<button type="submit">` with an internal state (like `isProcessing`) to conditionally render an inline loading indicator and disable the button, providing immediate and clear feedback to the user.

## 2024-03-06 - Add ARIA label to 'X' icon buttons
**Learning:** Text closures like 'X' are ambiguous for screen readers and must be equipped with descriptive `aria-label` attributes to support proper screen reader functionality.
**Action:** Always add an `aria-label` to visually-driven interactive elements or ambiguous text closures.

## 2024-05-14 - Interactive Icon Pointer Events
**Learning:** When layering absolute-positioned icons inside or over input fields to create custom UI elements (like the "lock" icon in an auth form), those icons can unintentionally intercept mouse clicks intended for the underlying input, creating a "dead zone" where the user clicks but the input doesn't focus.
**Action:** Always apply `pointer-events: none` to decorative, non-interactive visual elements placed over inputs to ensure clicks reliably pass through to the interactive elements underneath.
