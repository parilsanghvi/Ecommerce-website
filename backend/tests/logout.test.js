const userController = require('../controllers/userController');

describe('Logout Security', () => {
    it('should set a valid expiration date for the logout cookie', async () => {
        const req = {};
        const res = {
            cookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await userController.logout(req, res, next);

        expect(res.cookie).toHaveBeenCalledWith("token", null, expect.any(Object));

        const cookieOptions = res.cookie.mock.calls[0][2];

        // Check if expires is a valid Date object
        expect(cookieOptions.expires).toBeInstanceOf(Date);
        expect(cookieOptions.expires.getTime()).not.toBeNaN(); // isValid Date
    });
});
