const {
    Router
} = require("express")
const express = require("express")
const {
    registerUser,
    loginUser,
    logout,
    forgotPassword,
    resetPassword,
    getUserDetails,
    updatePassword,
    updateProfile,
    getAllUser,
    getSingleUser,
    deleteUser,
    updateUserRole
} = require("../controllers/userController")
const upload = require("../middleware/multer")
const {
    isAuthenticatedUser,
    authorizedRoles
} = require("../middleware/auth")
const validate = require("../middleware/validate");
const { registerSchema, loginSchema, updateProfileSchema } = require("../schemas/userZodSchema");
const router = express.Router()

router.route("/register").post(upload.any(), validate(registerSchema), registerUser);

router.route("/login").post(validate(loginSchema), loginUser)

router.route("/password/forgot").post(forgotPassword);

router.route("/password/reset/:token").put(resetPassword);

router.route("/logout").get(logout)

router.route("/me").get(isAuthenticatedUser, getUserDetails)

router.route("/password/update").put(isAuthenticatedUser, updatePassword)

router.route("/me/update").put(isAuthenticatedUser, upload.any(), validate(updateProfileSchema), updateProfile)

router.route("/admin/users").get(isAuthenticatedUser, authorizedRoles("admin"), getAllUser)

router.route("/admin/user/:id").get(isAuthenticatedUser, authorizedRoles("admin"), getSingleUser)

router.route("/admin/user/:id").delete(isAuthenticatedUser, authorizedRoles("admin"), deleteUser)

router.route("/admin/user/:id").put(isAuthenticatedUser, authorizedRoles("admin"), updateUserRole)

module.exports = router;