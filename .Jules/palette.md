## 2025-02-18 - Accessibility Anti-Patterns
**Learning:** This codebase implements interactive tabs using `<p>` tags with `onClick` handlers, which makes them inaccessible to keyboard users.
**Action:** When working on navigation or toggle components, check for semantic HTML usage. If `div` or `p` tags are used for buttons, upgrade them to `<button>` or add `role="button"`, `tabIndex="0"`, and `onKeyDown` handlers to ensure accessibility.

## 2025-02-18 - Component-Specific CSS
**Learning:** This codebase uses CSS files associated with specific components (e.g. `Products.css` for `Products.js`). When adding new UI states (like empty states), it's better to add a new class to the existing component CSS file rather than using inline styles, to maintain separation of concerns and keep the JSX clean.
**Action:** Always check for an existing `.css` file for the component and append new styles there.

## 2025-02-18 - Form Input Labeling
**Learning:** Found input fields (specifically search) relying solely on placeholders, which is a common accessibility failure.
**Action:** Always ensure inputs have an associated `<label>` or `aria-label`. When using `placeholder`, it should provide an example of expected input, not serve as the label itself.
