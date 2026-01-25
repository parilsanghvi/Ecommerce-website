## 2025-02-18 - Accessibility Anti-Patterns
**Learning:** This codebase implements interactive tabs using `<p>` tags with `onClick` handlers, which makes them inaccessible to keyboard users.
**Action:** When working on navigation or toggle components, check for semantic HTML usage. If `div` or `p` tags are used for buttons, upgrade them to `<button>` or add `role="button"`, `tabIndex="0"`, and `onKeyDown` handlers to ensure accessibility.

## 2025-02-18 - Component-Specific CSS
**Learning:** This codebase uses CSS files associated with specific components (e.g. `Products.css` for `Products.js`). When adding new UI states (like empty states), it's better to add a new class to the existing component CSS file rather than using inline styles, to maintain separation of concerns and keep the JSX clean.
**Action:** Always check for an existing `.css` file for the component and append new styles there.

## 2025-02-18 - Form Input Labeling
**Learning:** Found input fields (specifically search) relying solely on placeholders, which is a common accessibility failure.
**Action:** Always ensure inputs have an associated `<label>` or `aria-label`. When using `placeholder`, it should provide an example of expected input, not serve as the label itself.

## 2025-02-18 - Interactive Lists and Class Name Verification
**Learning:** Found a typo in class name (`category-box` vs `categoryBox`) preventing styles from applying, and interactive list items lacking keyboard support.
**Action:** When refactoring interactive lists, ensure `li` elements have `role="button"`, `tabIndex="0"`, and `onKeyDown` handlers. Always verify class names against the imported CSS file.

## 2025-02-18 - Keyboard Event Handling
**Learning:** When adding keyboard support for 'Space', always `preventDefault()` to prevent the default page scroll behavior.
**Action:** Include `e.preventDefault()` in `onKeyDown` handlers for Space key.

## 2025-02-18 - Disabled Button Styling
**Learning:** Standard browser `disabled` attribute might not be enough for visual feedback in this design system, especially for small icon-only buttons.
**Action:** When adding `disabled` attributes, explicitly style `:disabled` state in the component's CSS to ensure users perceive the element as non-interactive (e.g., `opacity: 0.5`, `cursor: not-allowed`).

## 2025-02-19 - Text Area Feedback
**Learning:** Long-form inputs like review textareas often lack immediate feedback on length, leading to user uncertainty. Also, they frequently miss accessible labels when inside dialogs.
**Action:** Always pair textareas with a character count or limit indicator, and ensure they have an explicit `aria-label` or `<label>` element, especially in modals/dialogs where context might be visually obvious but programmatically hidden.
