## 2024-05-17 - N+1 Query in Order Controller
**Learning:** When using `.populate()` to resolve an N+1 query, be mindful of orphaned relationships where the referenced document might have been deleted, which results in `null` rather than a populated object. Security checks attempting to access properties like `_id` on this null object will crash the server.
**Action:** Always ensure safety checks are in place (e.g., `!order.user` or optional chaining `order.user?._id`) when accessing fields of a populated property that could potentially be missing.
