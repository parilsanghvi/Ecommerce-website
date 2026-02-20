const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock dependencies to avoid side effects
jest.mock('../utlis/sendEmail', () => jest.fn());
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn(),
        },
    },
}));

let app;
let mongoServer;

describe('Security Headers Middleware', () => {
    // Increase timeout for MongoMemoryServer startup
    jest.setTimeout(60000);

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        process.env.DB_URI = uri;

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri);
        }

        // Import app after setting DB_URI
        app = require('../app');
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should set critical security headers', async () => {
        const res = await request(app).get('/api/v1/products'); // Use a valid route

        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('should set HSTS header in PRODUCTION environment', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'PRODUCTION';

        const res = await request(app).get('/api/v1/products');

        expect(res.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');

        // Restore environment
        process.env.NODE_ENV = originalEnv;
    });

    it('should set HSTS header if request is secure (HTTPS)', async () => {
        // Supertest doesn't easily simulate HTTPS physically, but we can mock req.secure
        // OR we can test X-Forwarded-Proto which our middleware supports

        const res = await request(app)
            .get('/api/v1/products')
            .set('X-Forwarded-Proto', 'https');

        expect(res.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
    });

    it('should NOT set HSTS header in development/test environment without HTTPS', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const res = await request(app).get('/api/v1/products');

        expect(res.headers['strict-transport-security']).toBeUndefined();

        process.env.NODE_ENV = originalEnv;
    });
});
