# Features, Improvements & UI/UX Audit

> **Date**: January 21, 2026  
> **Status**: Work in Progress  
> **Source**: Comprehensive UI Audit (Desktop/Mobile, Light/Dark Modes)

---

## 🚨 Critical Bugs & Functional Gaps

### 1. Admin Dashboard Access (Major)
*   **Issue**: Admin user is consistently redirected to `/account` when attempting to access `/admin/dashboard`.
*   **Sidebar**: Even when logged in as admin, the sidebar displays public links (Home, etc.) instead of Admin navigation.
*   **Redirect Loop**: The "Dashboard" link in the profile menu triggers a redirect loop (`/admin/dashboard` -> `/account`).
*   **Root Cause**: Likely a `ProtectedRoute` logic error or state verification issue in `App.js`.

### 2. Footer Layout (Mobile)
*   **Issue**: The footer layout is broken on mobile viewports (375px width).
*   **Impact**: Content overlaps or is misaligned, making links unclickable or unreadable.

---

## 🎨 UI/UX Improvements

### 3. Cart Page
*   **Table Header**: "QUANTITYSUBTOTAL" is displayed as a single word. Needs spacing.
*   **Empty State**: Improved visual feedback needed when the cart is empty (currently just a plain text/blank feel).
*   **Buttons**: The "REMOVE" button has a nearly invisible red border in Dark Mode. Needs higher contrast.

### 4. Product Details Page
*   **Visual Alignment**: 
    *   "LOG A REVIEW" button shadow in Dark Mode is slightly misaligned ("floating").
    *   "ADD TO CART" button is often pushed below the fold on standard laptop screens.
*   **Dark Mode**: 
    *   Quantity selector input has an overly high-contrast border compared to other inputs.
    *   Button shadows should be standardized.

### 5. Landing Page
*   **Mobile Typography**: The "FEATURED DROPS" heading is disproportionately large on mobile, occupying 30%+ of the viewport.
*   **Hover States**: Product card borders in Dark Mode sometimes get "stuck" in the green hover state.

### 6. General UI Consistency
*   **Button Styles**: 
    *   Standardize all primary action buttons (Login, Pay, Add to Cart) to use a shared CSS class (e.g., `.primary-btn`) for consistent shadows, padding, and hover effects.
    *   Currently, some define their own unique styles/shadow depths.
*   **Dark Mode Transition**: Add a smooth CSS transition for `background-color` and `color` on the `body` tag to prevent "white flash" when toggling themes.

---

## 🚀 Feature Suggestions

1.  **Quick View**: Add a hover overlay on Product Cards in the inventory list to preview details without clicking through.
2.  **Related Products**: Add a "You May Also Like" section to the Product Details page.
3.  **Mobile Touch Targets**: Increase the hit area size for the Header icons (Search, Cart, Profile) to improve mobile usability.
4.  **Admin Quick Stats**: Convert the "Total Amount" bar in the Admin Dashboard into a card style to match the other stats (Products, Users, Orders).
