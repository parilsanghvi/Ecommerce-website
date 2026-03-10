## 2025-03-10 - Performance: Document Deletion
**Learning:** Using `findByIdAndDelete()` instead of `findById()` followed by `deleteOne()` reduces database queries from 2 to 1 and bypasses Mongoose document hydration overhead.
**Action:** Replaced `Order.findById` + `order.deleteOne()` with a single `Order.findByIdAndDelete` in `backend/controllers/orderController.js`.
