## 2025-01-24 - User Controller Optimization
**Learning:** `isAuthenticatedUser` middleware already fetches and attaches the full user document to `req.user`. Subsequent controllers like `getUserDetails` often re-fetch the user from the DB using `req.user.id`, which is a redundant operation.
**Action:** In controllers following authentication middleware, check if `req.user` already contains the necessary data before making another DB call.

## 2025-02-21 - Delete Review Optimization
**Learning:** Fetching an entire parent document just to delete one item from an array (e.g., reviews in a product) is a massive performance bottleneck and a race condition (overwriting entire array).
**Action:** Use `findOne` with projection (e.g., `reviews: { $elemMatch: { _id: id } }`) to fetch only necessary data for validation, and use `$pull` in `findByIdAndUpdate` for atomic removal.

## 2025-02-23 - Frontend Re-render Computations
**Learning:** Derived state calculated from expensive array operations like `reduce` (e.g., calculating cart totals) runs synchronously on every render. If these components re-render often (e.g., due to loading states or form inputs), this becomes a bottleneck.
**Action:** Always wrap `Array.prototype.reduce`, `map`, or `filter` operations that derive data from props/state in a `useMemo` hook with strict dependencies.
## 2025-02-28 - Offload forgotPassword email sending to background
**Learning:** External network calls like `sendEmail` introduce significant latency. By wrapping the call in `Promise.resolve().catch()` and not awaiting it, we can offload the blocking operation to the background. We must catch unhandled rejections to prevent crashing the application while cleaning up any created resources (like the invalidated reset tokens) in the catch block.
**Action:** Identify and isolate operations that require external network I/O but don't strictly gate the client response. Use background tasks (or asynchronous Promise executions without `await`) while properly handling their errors in the background to ensure responsive APIs without side effects.

## 2025-02-17 - Pagination Optimization for Product Reviews
**Learning:** Returning unpaginated embedded arrays like `reviews` from MongoDB causes significant memory bloat and slow network response times as data scales. Using Mongoose's `$slice` projection efficiently truncates arrays directly at the database level.
**Action:** When implementing pagination, update frontend Redux thunks to separate global `loading` state from chunked `loadingMoreReviews` state, ensuring "Load More" actions don't trigger disruptive full-screen loaders. Also, ensure components use `useParams()` instead of deprecated `match.params` in React Router v6.
