## 2024-05-14 - Replace input buttons with `<button>` tags for Async operations
**Learning:** Using `<input type="submit">` for important asynchronous actions (like payment processing) prevents the inclusion of visual feedback elements like inline spinners (`CircularProgress`). This leads to a poor user experience as the user is unsure if their action registered, and can cause anxiety during sensitive operations like payments.
**Action:** When creating forms that trigger long-running asynchronous tasks, always use a `<button type="submit">` with an internal state (like `isProcessing`) to conditionally render an inline loading indicator and disable the button, providing immediate and clear feedback to the user.

## 2024-03-06 - Add ARIA label to 'X' icon buttons
**Learning:** Text closures like 'X' are ambiguous for screen readers and must be equipped with descriptive `aria-label` attributes to support proper screen reader functionality.
**Action:** Always add an `aria-label` to visually-driven interactive elements or ambiguous text closures.
## 2024-05-28 - Fix dynamic button accessible name override
**Learning:** Avoid applying static `aria-label` attributes to buttons containing dynamic, contextually important text (e.g., 'Pay - ₹110'). A static `aria-label` completely overrides the element's visible text for screen readers, masking essential contextual information.
**Action:** Use `aria-label` conditionally (e.g., `aria-label={isProcessing ? "Processing payment" : undefined}`) or rely on native text content to ensure dynamic information is accessible.
