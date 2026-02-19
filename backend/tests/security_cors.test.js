const request = require('supertest');
const app = require('../app');

describe('CORS Security', () => {
    it('should NOT allow unauthorized origins (http://evil.com)', async () => {
        const res = await request(app)
            .get('/api/v1/non-existent-route')
            .set('Origin', 'http://evil.com');

        // Should return 500 because the CORS middleware calls next(err)
        // And the error middleware returns 500
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Not allowed by CORS');
        // Access-Control-Allow-Origin should NOT be present (or at least not evil.com)
        // Actually, if it errors, no CORS headers are set usually.
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should allow localhost:3000', async () => {
        const res = await request(app)
            .get('/api/v1/non-existent-route')
            .set('Origin', 'http://localhost:3000');

        // Should NOT return 500. It might return 404 because route doesn't exist, but that's fine.
        expect(res.status).not.toBe(500);

        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
        expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow requests with no origin (e.g. server-to-server)', async () => {
        const res = await request(app)
            .get('/api/v1/non-existent-route');
            // No Origin header set

        expect(res.status).not.toBe(500);
    });
});
