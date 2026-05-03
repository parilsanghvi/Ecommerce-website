## 2024-05-14 - Replace input buttons with `<button>` tags for Async operations
**Learning:** Using `<input type="submit">` for important asynchronous actions (like payment processing) prevents the inclusion of visual feedback elements like inline spinners (`CircularProgress`). This leads to a poor user experience as the user is unsure if their action registered, and can cause anxiety during sensitive operations like payments.
**Action:** When creating forms that trigger long-running asynchronous tasks, always use a `<button type="submit">` with an internal state (like `isProcessing`) to conditionally render an inline loading indicator and disable the button, providing immediate and clear feedback to the user.

## 2024-03-06 - Add ARIA label to 'X' icon buttons
**Learning:** Text closures like 'X' are ambiguous for screen readers and must be equipped with descriptive `aria-label` attributes to support proper screen reader functionality.
**Action:** Always add an `aria-label` to visually-driven interactive elements or ambiguous text closures.
## $(date +%Y-%m-%d) - Password Visibility Toggles & Unmounted Components
**Learning:**
1. When fixing UX on forms, it's critical to ensure absolute-positioned decorative elements don't block interaction by using `pointer-events: none`.
2. Adding interactive UX like toggles inside form fields requires adjusting input padding so text doesn't flow underneath the new icons.
3. When using refs in async callbacks (like `.disabled` toggling on errors), checking component mounted state avoids test crashes.
**Action:** Always check `pointer-events` on adjacent absolute SVGs when adding interactive inline buttons, ensure right padding matches new icon size, and defensively wrap ref manipulations in `if (ref.current)` inside catch blocks.
