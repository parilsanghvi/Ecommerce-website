## 2025-01-24 - User Controller Optimization
**Learning:** `isAuthenticatedUser` middleware already fetches and attaches the full user document to `req.user`. Subsequent controllers like `getUserDetails` often re-fetch the user from the DB using `req.user.id`, which is a redundant operation.
**Action:** In controllers following authentication middleware, check if `req.user` already contains the necessary data before making another DB call.

## 2026-02-08 - Product List Optimization
**Learning:** Product listing endpoints (getAllProducts, getAdminProducts) were fetching the entire reviews array for every product. For products with many reviews, this creates significant database and network overhead.
**Action:** Use `.select("-reviews")` in Mongoose queries for list views to exclude heavy embedded arrays that are not needed for the UI card display.

## 2026-02-12 - Product Reviews Optimization
**Learning:** `getProductReviews` fetched the entire product document just to get the `reviews` array. This is wasteful as product descriptions and images are fetched unnecessarily.
**Action:** Use `.select('reviews')` to only fetch the required field when the endpoint serves only a subset of document data.
