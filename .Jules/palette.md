## 2024-05-22 - Shared Loading State UX Anti-Pattern
**Learning:** This app uses a single `loading` state in Redux slices for multiple async actions (e.g., fetching product details AND submitting a review). This causes jarring UX where the entire page replaced by a loader when performing a sub-action.
**Action:** When working on "Product" or similar slices, check if `loading` is used for the main content render. If so, avoid using the global `loading` state for button feedback if it triggers a full-page unmount. Instead, use local state or refine the render condition to only show full-page loader if data is missing (`!product`).

## 2024-05-22 - Testing Material UI Rating
**Learning:** Material UI Rating component hides radio inputs. Playwright `click()` on the input fails.
**Action:** Target the `<label>` or use `get_by_text("X Stars")` if available, and sometimes `force=True` is needed if the label wraps the hidden input but is visually handled by SVGs.
