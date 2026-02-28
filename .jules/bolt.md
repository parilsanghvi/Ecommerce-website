## 2025-01-24 - User Controller Optimization
**Learning:** `isAuthenticatedUser` middleware already fetches and attaches the full user document to `req.user`. Subsequent controllers like `getUserDetails` often re-fetch the user from the DB using `req.user.id`, which is a redundant operation.
**Action:** In controllers following authentication middleware, check if `req.user` already contains the necessary data before making another DB call.

## 2025-02-21 - Delete Review Optimization
**Learning:** Fetching an entire parent document just to delete one item from an array (e.g., reviews in a product) is a massive performance bottleneck and a race condition (overwriting entire array).
**Action:** Use `findOne` with projection (e.g., `reviews: { $elemMatch: { _id: id } }`) to fetch only necessary data for validation, and use `$pull` in `findByIdAndUpdate` for atomic removal.

## 2025-02-23 - Frontend Re-render Computations
**Learning:** Derived state calculated from expensive array operations like `reduce` (e.g., calculating cart totals) runs synchronously on every render. If these components re-render often (e.g., due to loading states or form inputs), this becomes a bottleneck.
**Action:** Always wrap `Array.prototype.reduce`, `map`, or `filter` operations that derive data from props/state in a `useMemo` hook with strict dependencies.
## 2025-02-13 - [Performance improvement] Debounce Price Slider API Calls
**Learning:** Using `useEffect` to dispatch API requests directly on range slider dependency changes causes a high volume of redundant API requests whenever the user is actively sliding or interacting with UI elements that immediately update filter state. Adding a simple `setTimeout` and `clearTimeout` acts as a basic yet powerful debounce, effectively batching and preventing unneeded rapid-fire requests.
**Action:** Always implement a debounce pattern (using custom hooks or a `setTimeout` within `useEffect`) when triggering API calls based on rapidly-updating UI input controls like text fields or sliders to save client and server resources. Furthermore, when adding a debounce, testing suites should be updated to expect asynchronous state changes using helpers like `waitFor`.
