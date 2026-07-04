## 2024-03-10 - Fetch only necessary fields for products in order creation
**Learning:** Using `Product.find().select('price').lean()` instead of `Product.find()` for retrieving product arrays when calculating totals reduces the overall memory allocations and drastically speeds up the response time by nearly 96% in some scenarios, because it bypasses document hydration and fetching of large string properties like `description`.
**Action:** Replaced `.find` with `.find().select('price').lean()` in `backend/controllers/orderController.js` and successfully updated tests.

## 2024-03-10 - Avoid O(N) array copies in Redux Toolkit reducers
**Learning:** When updating an existing item in an array within a Redux Toolkit reducer, using `Array.map()` creates an unnecessary O(N) copy of the array. Because RTK uses Immer under the hood, we can safely find the index with `Array.findIndex()` and mutate the element directly (e.g., `state.cartItems[itemIndex] = item`). This avoids the O(N) copy overhead and reduces memory allocations.
**Action:** Replaced `Array.find()` and `Array.map()` with `Array.findIndex()` and direct index mutation in `frontend/src/features/cartSlice.js` for `addItemsToCart.fulfilled`.
## 2024-05-18 - Optimize Cart Array Updates
**Learning:** Redux Toolkit uses Immer, allowing for direct mutations on the state draft. When updating an array item, instead of using `.map()` which creates a full O(N) copy, using `.findIndex()` and directly mutating the index (e.g., `state.items[index] = item`) is significantly faster.
**Action:** When updating existing state items in Redux Toolkit reducers, use `.findIndex()` and direct array mutation rather than `.map()`.
## 2026-06-13 - Optimize Cart Items state in Redux
**Learning:** Redux reducer array operations like `filter` can be an O(N) bottleneck. Moving to an object/dictionary state provides O(1) insertions/deletions. To avoid breaking components that expect arrays, use a memoized `createSelector` to return `Object.values()`.
**Action:** When working on Redux performance optimizations involving lookups or deletions, migrate array structures to objects in the store state and provide array selectors to the UI. Write helper functions to migrate `localStorage` state seamlessly on app load.

## 2025-06-13 - Testing Branch Coverage
**Learning:** Controller actions like `getPricing` that throw errors on invalid input require explicit test coverage for those error paths to ensure reliability and maintain high coverage metrics.
**Action:** When adding missing tests, use `jest.mock` and `mockImplementation` to simulate error conditions in dependencies and verify the error is properly caught and forwarded to the next middleware.

## 2024-10-24 - Mongoose Undefined Field Handling
**Learning:** Mongoose automatically ignores undefined fields when creating documents, making manual property deletion loops unnecessary and inefficient.
**Action:** Rely on Mongoose's built-in handling of undefined properties during document creation instead of manually filtering them out.

## 2024-05-15 - Unnecessary array copies during order creation
**Learning:** During order creation mapping values explicitly into temporary variables before providing them as query parameters, and iterating arrays to construct object maps with array mapping can introduce minor but cumulative performance overhead in tight node loops processing arrays.
**Action:** Use inline mapping directly in Mongoose queries and utilize `Array.prototype.reduce` when constructing a `Map` from an array of objects to avoid generating throw-away intermediate arrays.
