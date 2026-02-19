const mongoose = require('mongoose');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('User Model Security', () => {
    it('should set a valid resetPasswordExpire date', () => {
        const user = new User({
            name: 'test',
            email: 'test@test.com',
            password: 'password',
            avatar: { public_id: 'id', url: 'url' }
        });

        user.getResetPasswordToken();

        console.log('Expire Value:', user.resetPasswordExpire);

        // This is what we expect for a secure implementation
        expect(user.resetPasswordExpire).toBeInstanceOf(Date);

        // If it's a valid date, it should be in the future
        if (user.resetPasswordExpire instanceof Date) {
            expect(!isNaN(user.resetPasswordExpire.getTime())).toBe(true);
            expect(user.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
        }
    });

    it('should generate a valid JWT token', () => {
        const user = new User({
            name: 'test',
            email: 'test@test.com',
            password: 'password',
            avatar: { public_id: 'id', url: 'url' }
        });

        const token = user.getJWTToken();
        expect(typeof token).toBe('string');

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.id).toBe(user._id.toString());
    });

    it('should correctly compare passwords', async () => {
        const user = new User({
            name: 'test',
            email: 'test@test.com',
            password: 'password',
            avatar: { public_id: 'id', url: 'url' }
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash('password123', salt);

        const isMatch = await user.comparePassword('password123');
        const isNotMatch = await user.comparePassword('wrongpassword');

        expect(isMatch).toBe(true);
        expect(isNotMatch).toBe(false);
    });
});
