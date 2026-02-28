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

## 2025-02-18 - Image Accessibility
**Learning:** Found critical accessibility issues where image `alt` text was hardcoded to "ssa" or "Product", providing no value to screen readers.
**Action:** Always bind `alt` text to dynamic content (e.g., `alt={item.name}`) when displaying product images or other dynamic content. Avoid placeholder strings in production code.

## 2025-02-18 - Tooltips on Disabled Buttons
**Learning:** Browsers often disable mouse events on `disabled` buttons, preventing tooltips from appearing. This codebase uses `pointer-events: none` on disabled buttons which exacerbates this.
**Action:** To show tooltips on disabled actions, use `aria-disabled="true"` instead of `disabled` attribute, remove `pointer-events: none` from CSS, and wrap the button in a `Tooltip` component. Crucially, ensure the `onClick` handler explicitly checks the disabled condition since the button remains interactive.

## 2025-05-23 - Accessibility in Imperative Animation Code
**Learning:** The `LoginSignup` component used direct DOM manipulation via `refs` for tab switching animations, which made it difficult to manage accessibility states like `aria-selected` declaratively.
**Action:** When retrofitting accessibility into legacy imperative code, introduce a parallel React state (e.g., `activeTab`) to manage ARIA attributes without rewriting the entire animation logic.

## 2025-02-18 - Decorative Elements as Interactive
**Learning:** Found an empty `<button>` element used solely for a visual sliding underline effect. This pollutes the accessibility tree and confuses screen reader users.
**Action:** Replace purely decorative interactive elements with `<div>` or `<span>` and apply styles via CSS. Ensure these elements are removed from the focus order and accessibility tree.

## 2025-05-23 - Framer Motion and Test Environments
**Learning:** When using `layoutId` with `framer-motion` inside `Link` components (which are often mocked in tests), React may warn about unknown props being passed to DOM elements if the mock doesn't filter them out.
**Action:** When mocking `framer-motion` for tests, ensure the mock implementation explicitly destructures and filters out `layoutId` and other animation-specific props to prevent them from leaking to the underlying DOM element and causing console warnings.

## 2024-05-23 - Testing onBlur in JSDOM
**Learning:** Testing `onBlur` events in `jsdom` using `vitest` and `@testing-library/react` (specifically with `userEvent.tab()` or `click(document.body)`) proved unreliable for validating input validation logic in this specific setup.
**Action:** When testing blur logic, if standard `fireEvent` or `userEvent` fails to trigger handlers despite correct implementation, verify logic by isolating the handler or rely on `onChange` verification + manual/browser testing, rather than spending excessive time fighting the test environment.

## 2025-05-27 - Auto-focus on Search
**Learning:** For dedicated search pages or modals, users expect to type immediately. Requiring an extra click to focus the input is a friction point.
**Action:** Always add `autoFocus` to the primary input of a search page or search modal to reduce interaction cost.

## 2025-05-27 - Button Focus Styles
**Learning:** Found that `.primary-btn` explicitly removes `outline` without providing a fallback focus style, making keyboard navigation difficult.
**Action:** When removing `outline` for aesthetic reasons, always ensure `focus-visible` styles are provided (e.g., `outline: 3px solid var(--color-secondary); outline-offset: 4px;`) to maintain accessibility.
