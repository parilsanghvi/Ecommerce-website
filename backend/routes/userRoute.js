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
const { registerSchema, loginSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema } = require("../schemas/userZodSchema");
const rateLimiter = require("../middleware/rateLimiter");
const router = express.Router()

router.route("/register").post(rateLimiter(60 * 60 * 1000, 5, "Too many accounts created from this IP, please try again after an hour"), upload.none(), validate(registerSchema), registerUser);

router.route("/login").post(rateLimiter(15 * 60 * 1000, 10, "Too many login attempts, please try again later"), validate(loginSchema), loginUser)

router.route("/password/forgot").post(rateLimiter(15 * 60 * 1000, 5, "Too many password reset attempts, please try again later"), validate(forgotPasswordSchema), forgotPassword);

// 🛡️ Sentinel: Added rate limiting to prevent brute-force attacks on password reset tokens
router.route("/password/reset/:token").put(rateLimiter(15 * 60 * 1000, 5, "Too many password reset attempts, please try again later"), validate(resetPasswordSchema), resetPassword);

router.route("/logout").get(logout)

router.route("/me").get(isAuthenticatedUser, getUserDetails)

// 🛡️ Sentinel: Added rate limiting to mitigate rapid, automated password update attempts
router.route("/password/update").put(rateLimiter(15 * 60 * 1000, 5, "Too many password update attempts, please try again later"), isAuthenticatedUser, updatePassword)

router.route("/me/update").put(isAuthenticatedUser, upload.none(), validate(updateProfileSchema), updateProfile)

router.route("/admin/users").get(isAuthenticatedUser, authorizedRoles("admin"), getAllUser)

router.route("/admin/user/:id").get(isAuthenticatedUser, authorizedRoles("admin"), getSingleUser)

router.route("/admin/user/:id").delete(isAuthenticatedUser, authorizedRoles("admin"), deleteUser)

router.route("/admin/user/:id").put(isAuthenticatedUser, authorizedRoles("admin"), updateUserRole)

module.exports = router;