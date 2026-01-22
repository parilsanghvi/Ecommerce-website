const { z } = require("zod");

const registerSchema = z.object({
    name: z.string({ required_error: "please Enter your name" }).min(2, "Name must be at least 2 characters").max(30, "Name cannot exceed 30 characters"),
    email: z.string({ required_error: "please Enter your email" }).email("Please enter a valid email"),
    password: z.string({ required_error: "please Enter your password" }).min(8, "Password must be at least 8 characters"),
    avatar: z.string().optional(), // Base64 string from frontend
});

const loginSchema = z.object({
    email: z.string({ required_error: "Please enter email" }).email("Please enter a valid email"),
    password: z.string({ required_error: "Please enter password" }).min(1, "Please enter password"),
});

const updateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(30, "Name cannot exceed 30 characters").optional(),
    email: z.string().email("Please enter a valid email").optional(),
    avatar: z.string().optional(),
});

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
};
