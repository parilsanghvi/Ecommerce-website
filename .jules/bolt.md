## 2024-05-17 - [Cart Payment Inefficiency]
**Learning:** Found a loop doing O(N) single dispatches of `removeItemsFromCart` for every single item after an order was placed, creating O(N) independent state updates and React re-renders.
**Action:** Introduced an `emptyCart` reducer in `cartSlice` to handle removing all items in a single atomic state update, improving O(N) dispatch overhead to O(1) time. Added testing to prevent regression.
