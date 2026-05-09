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

## 2025-02-28 - Defer Stripe API Initialization
**Learning:** Initializing third-party heavy dependencies like Stripe (`@stripe/react-stripe-js`) and eagerly fetching their API configuration in the root `App` component unnecessarily inflates initial load times and network bandwidth for users who might not reach the checkout flow.
**Action:** Move API fetching and provider initialization logic into lazy-loaded route wrappers (e.g., `PaymentWrapper.jsx`) to code-split the logic. Store the initialized `loadStripe(apiKey)` instance in a React state hook to prevent continuous re-initialization.

## 2025-02-28 - Offload forgotPassword email sending to background
**Learning:** External network calls like `sendEmail` introduce significant latency. By wrapping the call in `Promise.resolve().catch()` and not awaiting it, we can offload the blocking operation to the background. We must catch unhandled rejections to prevent crashing the application while cleaning up any created resources (like the invalidated reset tokens) in the catch block.
**Action:** Identify and isolate operations that require external network I/O but don't strictly gate the client response. Use background tasks (or asynchronous Promise executions without `await`) while properly handling their errors in the background to ensure responsive APIs without side effects.

## 2025-02-17 - Pagination Optimization for Product Reviews
**Learning:** Returning unpaginated embedded arrays like `reviews` from MongoDB causes significant memory bloat and slow network response times as data scales. Using Mongoose's `$slice` projection efficiently truncates arrays directly at the database level.
**Action:** When implementing pagination, update frontend Redux thunks to separate global `loading` state from chunked `loadingMoreReviews` state, ensuring "Load More" actions don't trigger disruptive full-screen loaders. Also, ensure components use `useParams()` instead of deprecated `match.params` in React Router v6.

## 2024-05-20 - Unbounded Array Performance Optimization
**Learning:** Storing unbounded lists (like product reviews) as embedded arrays in MongoDB leads to massive document sizes, increased memory consumption, and severe O(N) penalties during read/write operations (e.g., finding a single review took ~240ms in an array of 10,000, vs. ~4.5ms in a separate indexed collection).
**Action:** When designing or refactoring schemas for data that can grow indefinitely, always move the data to a separate, indexed collection. Keep fast-aggregation statistics (like `numOfReviews` and `ratings`) embedded in the parent document. To maintain API backward compatibility, configure Mongoose virtuals on the parent schema to allow `.populate()` calls.

## 2025-03-03 - Memoizing Array Reductions in React Components
**Learning:** `Cart.jsx` and `ConfirmOrder.jsx` were recalculating derived state (like `grossTotal` or `subtotal`) by calling `cartItems.reduce()` directly inside the component's render body. This recalculation executes on every render, which becomes a bottleneck during frequent state updates like changing item quantities or showing loading spinners.
**Action:** Always wrap expensive operations like `Array.prototype.reduce`, `map`, or `filter` inside a `useMemo` hook with strict dependencies when calculating derived state in React components to prevent unnecessary re-evaluations.
## 2025-03-05 - Avoid Full Mongoose Hydration for Read-Only Validation\n**Learning:** When fetching data simply to extract a single field for validation (like verifying the `price` of a product during order creation or payment), fetching the entire document and hydrating it into a Mongoose object wastes significant CPU and memory. Mongoose objects contain heavy metadata, getters/setters, and methods that are entirely unused in this scenario.\n**Action:** Use `.select('price')` to limit the payload sent from MongoDB and append `.lean()` to the Mongoose query to return a lightweight, plain JavaScript object when only validating specific fields.\n

## 2025-03-03 - Stripe Elements Initialization Performance
**Learning:** Calling `loadStripe(apiKey)` directly within the `<Elements stripe={...}>` prop causes the Stripe object to re-initialize and inject heavy external scripts/iframes on every render of the parent component.
**Action:** Always call `loadStripe(apiKey)` once and store the resulting Promise in a React state variable (e.g., `stripePromise`), passing that state to the `<Elements>` provider to ensure referential stability.

## 2025-03-04 - Memoizing DataGrid Columns and Rows
**Learning:** When using `@mui/x-data-grid`, the `columns` prop acts as the definition for the entire grid. If the `columns` array is created inline during render, its reference changes on every component re-render. This forces the entire DataGrid component to needlessly unmount/remount internal components and causes the loss of all UI state (such as resized column widths). Similarly, reconstructing the `rows` array directly in the render body causes an O(N) operation to execute repetitively.
**Action:** Always wrap the `columns` definition array in a `useMemo` hook (remembering to also `useCallback` any inline event handlers referenced by it, like `deleteProductHandler`) and wrap the `rows` construction in `useMemo` to ensure referential stability.

## 2025-03-04 - Safely parsing JSON from sessionStorage
**Learning:** During tests or specific execution paths, `sessionStorage.getItem()` may return `undefined` (as a string) or fail to parse if the stored JSON string is corrupt or simply empty. Simply passing the result directly to `JSON.parse` (e.g., `JSON.parse(sessionStorage.getItem('key'))`) will throw a `SyntaxError` if it evaluates to `undefined`, breaking components like `Payment`.
**Action:** Always wrap `JSON.parse` operations that source data from `sessionStorage` or `localStorage` inside a `try...catch` block, and provide a secure fallback initialization state to ensure component resilience.
## 2025-03-05 - Avoid O(N) Document Counting
**Learning:** Using `countDocuments()` on a Mongoose model without providing any filter conditions forces MongoDB to perform a collection scan (or index scan if indexed) which operates in O(N) time. In contrast, `estimatedDocumentCount()` leverages collection metadata and returns an estimated count in O(1) time. This is especially problematic for large collections queried frequently, such as pagination endpoints for admin dashboards.
**Action:** When counting the total number of documents in a collection where no query parameters are applied, always replace `Model.countDocuments()` with `Model.estimatedDocumentCount()`.
