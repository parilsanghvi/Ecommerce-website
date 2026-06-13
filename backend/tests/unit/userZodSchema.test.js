const {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} = require('../../schemas/userZodSchema');

describe('User Zod Schemas', () => {
    describe('registerSchema', () => {
        it('should validate a valid registration payload', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                avatar: 'data:image/png;base64,...'
            });
            expect(result.success).toBe(true);
        });

        it('should fail if name is missing', () => {
            const result = registerSchema.safeParse({
                email: 'john@example.com',
                password: 'password123'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("please Enter your name");
        });

        it('should fail if name is too short', () => {
            const result = registerSchema.safeParse({
                name: 'J',
                email: 'john@example.com',
                password: 'password123'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Name must be at least 2 characters");
        });

        it('should fail if name is too long', () => {
            const result = registerSchema.safeParse({
                name: 'a'.repeat(31),
                email: 'john@example.com',
                password: 'password123'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Name cannot exceed 30 characters");
        });

        it('should fail if email is invalid', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'invalid-email',
                password: 'password123'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Please enter a valid email");
        });

        it('should fail if password is too short', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'pass'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
        });
    });

    describe('loginSchema', () => {
        it('should validate a valid login payload', () => {
            const result = loginSchema.safeParse({
                email: 'john@example.com',
                password: 'password123'
            });
            expect(result.success).toBe(true);
        });

        it('should fail if email is missing', () => {
            const result = loginSchema.safeParse({
                password: 'password123'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Please enter email");
        });

        it('should fail if email is invalid', () => {
            const result = loginSchema.safeParse({
                email: 'invalid-email',
                password: 'password123'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Please enter a valid email");
        });

        it('should fail if password is empty', () => {
            const result = loginSchema.safeParse({
                email: 'john@example.com',
                password: ''
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Please enter password");
        });
    });

    describe('updateProfileSchema', () => {
        it('should validate a valid update profile payload', () => {
            const result = updateProfileSchema.safeParse({
                name: 'Jane Doe',
                email: 'jane@example.com',
                avatar: 'base64...'
            });
            expect(result.success).toBe(true);
        });

        it('should validate an empty payload (all optional)', () => {
            const result = updateProfileSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('should fail if name is too short', () => {
            const result = updateProfileSchema.safeParse({
                name: 'J'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Name must be at least 2 characters");
        });

        it('should fail if email is invalid', () => {
            const result = updateProfileSchema.safeParse({
                email: 'invalid-email'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Please enter a valid email");
        });
    });

    describe('forgotPasswordSchema', () => {
        it('should validate a valid email', () => {
            const result = forgotPasswordSchema.safeParse({
                email: 'john@example.com'
            });
            expect(result.success).toBe(true);
        });

        it('should fail if email is invalid', () => {
            const result = forgotPasswordSchema.safeParse({
                email: 'invalid-email'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Please enter a valid email");
        });
    });

    describe('resetPasswordSchema', () => {
        it('should validate matching passwords', () => {
            const result = resetPasswordSchema.safeParse({
                password: 'password123',
                confirmPassword: 'password123'
            });
            expect(result.success).toBe(true);
        });

        it('should fail if passwords do not match', () => {
            const result = resetPasswordSchema.safeParse({
                password: 'password123',
                confirmPassword: 'password1234'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Passwords do not match");
            expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
        });

        it('should fail if password is too short', () => {
            const result = resetPasswordSchema.safeParse({
                password: 'pass',
                confirmPassword: 'pass'
            });
            expect(result.success).toBe(false);
            expect(result.error.issues.some(i => i.message === "Password must be at least 8 characters")).toBe(true);
        });
    });
});
