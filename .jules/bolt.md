# Bolt's Journal

## 2025-02-18 - [Initial Setup]
**Learning:** The project uses a root `package.json` for the backend and a separate `frontend/package.json` for the frontend. Backend tests must be run with `npx jest` as the `test` script in root `package.json` is a placeholder.
**Action:** Always check `package.json` scripts and directory structure before assuming standard `npm test` works.

## 2025-02-18 - [Testing Async Controllers]
**Learning:** `catchAsyncErrors` middleware wraps async controllers but does not return the promise, causing tests that `await` the controller to finish prematurely. This leads to `res.status` not being called before the assertion.
**Action:** When testing controllers wrapped in such middleware, mock the middleware to return the promise so the test can `await` the controller execution.

## 2025-02-18 - [Optimization: Mongoose .lean()]
**Learning:** `Product.find().lean()` returns plain JS objects, bypassing Mongoose hydration (no `save`, no virtuals like `id` unless configured).
**Action:** When using `.lean()`, ensure frontend or downstream logic doesn't rely on Mongoose-specific methods (like `.save()`) or virtual getters (like `id`). In this project, `_id` is used by the frontend, so `.lean()` is safe.
