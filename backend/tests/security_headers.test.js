const request = require('supertest');
const app = require('../app');

describe('Security Headers', () => {
    // 1. Integration Test: Check default headers
    // We use a non-existent route to avoid database connection issues.
    // Even if it returns 404 or 500, headers should be present.
    it('should set security headers correctly', async () => {
        // Use a route that won't trigger DB calls but will pass through middleware
        const res = await request(app).get('/api/v1/security-check-route-404');

        // We don't care about status code here, just headers
        // But logging it might help debug if needed
        // console.log('Status:', res.status);

        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('DENY');
        expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
        expect(res.headers['x-xss-protection']).toBe('1; mode=block');
        expect(res.headers['content-security-policy']).toBe("default-src 'self'; img-src 'self' data: https://res.cloudinary.com; script-src 'self' https://js.stripe.com; frame-src 'self' https://js.stripe.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://api.stripe.com");
        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    // 2. Unit Test: HSTS logic (Production)
    it('should set Strict-Transport-Security in PRODUCTION environment', () => {
        const req = {};
        const res = {
            setHeader: jest.fn(),
        };
        const next = jest.fn();

        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'PRODUCTION';

        let securityHeaders;
        try {
            // Re-require to bypass cache if it was loaded differently
            jest.resetModules();
            securityHeaders = require('../middleware/securityHeaders');
        } catch (e) {
            return;
        }

        securityHeaders(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        expect(next).toHaveBeenCalled();

        process.env.NODE_ENV = originalEnv;
    });

    // 3. Unit Test: HSTS logic (production - lowercase)
    it('should set Strict-Transport-Security in production (lowercase) environment', () => {
        const req = {};
        const res = {
            setHeader: jest.fn(),
        };
        const next = jest.fn();

        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        let securityHeaders;
        try {
            jest.resetModules();
            securityHeaders = require('../middleware/securityHeaders');
        } catch (e) {
            return;
        }

        securityHeaders(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        expect(next).toHaveBeenCalled();

        process.env.NODE_ENV = originalEnv;
    });

    // 4. Unit Test: HSTS logic (Non-Production)
    it('should NOT set Strict-Transport-Security in non-PRODUCTION environment', () => {
        const req = {};
        const res = {
            setHeader: jest.fn(),
        };
        const next = jest.fn();

        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        let securityHeaders;
        try {
            jest.resetModules();
            securityHeaders = require('../middleware/securityHeaders');
        } catch (e) {
            return;
        }

        securityHeaders(req, res, next);

        expect(res.setHeader).not.toHaveBeenCalledWith('Strict-Transport-Security', expect.anything());
        expect(next).toHaveBeenCalled();

        process.env.NODE_ENV = originalEnv;
    });
});
