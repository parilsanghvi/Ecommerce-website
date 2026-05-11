const express = require('express')
// takes crud functions from product controller
const {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductDetails,
    createProductReview,
    getProductReviews,
    deleteReview,
    getAdminProducts
} = require('../controllers/productController')
const upload = require("../middleware/multer")
// routing function
const router = express.Router()
const {
    isAuthenticatedUser,
    authorizedRoles
} = require("../middleware/auth")

// requests crud operation with the link 
router.route("/products").get(getAllProducts);
router.route("/admin/products").get(isAuthenticatedUser, authorizedRoles("admin"), getAdminProducts)
// Security Fix: Replaced upload.any() with upload.array("images") to prevent arbitrary file uploads
router.route("/admin/product/new").post(isAuthenticatedUser, authorizedRoles("admin"), upload.array("images"), createProduct);

router.route("/admin/product/:id").put(isAuthenticatedUser, authorizedRoles("admin"), upload.array("images"), updateProduct).delete(isAuthenticatedUser, authorizedRoles("admin"), deleteProduct);

router.route("/product/:id").get(getProductDetails)

router.route("/review").put(isAuthenticatedUser, createProductReview);

router.route("/reviews").get(getProductReviews).delete(isAuthenticatedUser, deleteReview);
// exports routes to app
module.exports = router;