## 2025-02-18 - Accessibility Anti-Patterns
**Learning:** This codebase implements interactive tabs using `<p>` tags with `onClick` handlers, which makes them inaccessible to keyboard users.
**Action:** When working on navigation or toggle components, check for semantic HTML usage. If `div` or `p` tags are used for buttons, upgrade them to `<button>` or add `role="button"`, `tabIndex="0"`, and `onKeyDown` handlers to ensure accessibility.
