
const sendToken = require('../utlis/jwtToken');

describe('JWT Token Utility', () => {
    let req, res, user;
    let originalEnv;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        user = {
            getJWTToken: jest.fn().mockReturnValue('mockToken')
        };
        originalEnv = process.env;
        process.env = { ...originalEnv };
        process.env.COOKIE_EXPIRE = 5;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should set secure cookie in PRODUCTION', () => {
        process.env.NODE_ENV = 'PRODUCTION';

        sendToken(user, 200, res);

        const cookieCall = res.cookie.mock.calls[0];
        const options = cookieCall[2];

        expect(options).toHaveProperty('expires'); // Fixed bug
        expect(options).toHaveProperty('httpOnly', true);
        expect(options).toHaveProperty('secure', true); // Fixed security gap
        expect(options).toHaveProperty('sameSite', 'strict'); // Fixed security gap
    });

    it('should set secure cookie in "production" (lowercase)', () => {
        process.env.NODE_ENV = 'production';

        sendToken(user, 200, res);

        const cookieCall = res.cookie.mock.calls[0];
        const options = cookieCall[2];

        expect(options).toHaveProperty('secure', true);
        expect(options).toHaveProperty('sameSite', 'strict');
    });

    it('should NOT set secure cookie in DEVELOPMENT', () => {
        process.env.NODE_ENV = 'DEVELOPMENT';

        sendToken(user, 200, res);

        const cookieCall = res.cookie.mock.calls[0];
        const options = cookieCall[2];

        expect(options).toHaveProperty('secure', false);
    });

    it('should NOT include token in JSON response', () => {
        sendToken(user, 200, res);

        const jsonCall = res.json.mock.calls[0][0];

        expect(jsonCall).not.toHaveProperty('token');
        expect(jsonCall).toHaveProperty('success', true);
        expect(jsonCall).toHaveProperty('user');
    });
});
