const request = require('supertest');
const app = require('../app');

describe('Security Payload Limit Test', () => {
    // We use a non-existent route to avoid hitting controller logic / database.
    // Express middleware (body-parser) runs before routing.
    // If the payload is too large, it should return 413 immediately.
    // If the payload is accepted, it should reach the router and return 404.

    it('should reject a JSON payload larger than 1MB with 413 Payload Too Large', async () => {
        // Create a large payload (slightly larger than 1MB)
        const largePayload = {
            data: 'a'.repeat(1.1 * 1024 * 1024) // ~1.1MB
        };

        const res = await request(app)
            .post('/api/v1/nonexistent_route_for_test')
            .send(largePayload)
            .set('Content-Type', 'application/json');

        // Current behavior (Vulnerable): Returns 404 (Body parsed, route not found)
        // Fixed behavior (Secure): Returns 413 (Body too large)
        expect(res.status).toBe(413);
    });

    it('should accept a small JSON payload', async () => {
        const smallPayload = {
            data: "small"
        };

        const res = await request(app)
            .post('/api/v1/nonexistent_route_for_test')
            .send(smallPayload)
            .set('Content-Type', 'application/json');

        // Should NOT be 413. Should be 404.
        expect(res.status).toBe(404);
    });
});
