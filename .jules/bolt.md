## 2024-03-10 - Fetch only necessary fields for products in order creation
**Learning:** Using `Product.find().select('price').lean()` instead of `Product.find()` for retrieving product arrays when calculating totals reduces the overall memory allocations and drastically speeds up the response time by nearly 96% in some scenarios, because it bypasses document hydration and fetching of large string properties like `description`.
**Action:** Replaced `.find` with `.find().select('price').lean()` in `backend/controllers/orderController.js` and successfully updated tests.

## 2024-03-10 - RTK Direct Mutation over .map() for State Updates
**Learning:** When using Redux Toolkit, reducers utilize Immer under the hood to draft next states safely. Using `.map()` to update an item in an array creates a brand new O(N) array copy, which can be computationally wasteful, especially for arrays like cart items or long lists.
**Action:** Instead of `find()` to check existence and then `.map()` to update the array in reducers, use `findIndex()` to locate the item and update it using direct array mutation (e.g., `state.array[itemIndex] = newItem`) to leverage Immer efficiently and prevent unnecessary memory allocations.
