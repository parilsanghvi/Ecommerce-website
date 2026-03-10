## 2025-03-10 - Optimize admin user deletion with lean()
**Learning:** Using `.lean()` on Mongoose queries returns plain JavaScript objects, eliminating the CPU and memory overhead of instantiating full Mongoose documents. However, this means document instance methods like `user.deleteOne()` are no longer available and must be replaced with static model methods like `User.deleteOne({ _id: req.params.id })`.
**Action:** Appended `.lean()` to the `User.findById` query in `deleteUser` and refactored the document deletion to use the static `User.deleteOne` method.
