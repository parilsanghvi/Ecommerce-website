const request = require('supertest');
const app = require('../app');

describe('Rate Limiter Middleware', () => {
    it('should limit requests to 100 per 15 minutes', async () => {
        // We do 100 requests in Promise.all to be faster
        const requests = [];
        for (let i = 0; i < 100; i++) {
            requests.push(request(app).get('/api/v1/products'));
        }

        const responses = await Promise.all(requests);
        responses.forEach(response => {
             expect(response.status).not.toBe(429);
        });

        // The 101st request should be rate limited
        const rateLimitedResponse = await request(app).get('/api/v1/products');
        expect(rateLimitedResponse.status).toBe(429);
        expect(rateLimitedResponse.text).toBe('Too many requests from this IP, please try again after 15 minutes');
    }, 30000); // 30 seconds
});
