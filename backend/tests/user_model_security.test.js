const mongoose = require('mongoose');
const User = require('../models/userModel');

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
});
