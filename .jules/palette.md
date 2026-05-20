## 2024-05-20 - Add password visibility toggle to Reset Password
**Learning:** When introducing new interactive elements with custom classes (like `.password-toggle-btn`) inside existing components, you must ensure the corresponding CSS is also added or exists, otherwise the browser will render it with default styles that clash with the dark theme.
**Action:** Always check the paired `.css` file when adding new class names in JSX files to ensure proper styling and alignment are present.
