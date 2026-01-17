const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/userModel');
const mongoSanitize = require('../middleware/mongoSanitize');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('NoSQL Injection Vulnerability & Fix', () => {
    beforeEach(async () => {
        await User.deleteMany({});
        await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'securepassword123',
            avatar: { public_id: 'dummy', url: 'dummy' },
            role: 'admin'
        });
    });

    it('should be vulnerable to NoSQL injection if input is NOT sanitized', async () => {
        const maliciousEmail = { $ne: null };
        const user = await User.findOne({ email: maliciousEmail });
        expect(user).not.toBeNull();
        expect(user.email).toBe('admin@example.com');
    });

    it('should be SAFE from NoSQL injection if input IS sanitized', async () => {
        // Mock request object
        const req = {
            body: {
                email: { $ne: null }
            },
            query: {},
            params: {}
        };
        const res = {};
        const next = jest.fn();

        // Apply sanitizer
        mongoSanitize(req, res, next);

        // Expect keys starting with $ to be removed
        expect(req.body.email).toEqual({});

        // When Mongoose tries to cast {} to string for email, it throws CastError.
        // This CastError effectively blocks the request from proceeding with a valid query that matches something.
        // In a real controller, this would be caught by catchAsyncErrors (or crash the request),
        // effectively protecting against the auth bypass.

        // We verify that it throws CastError or returns null, but definitely NOT the user.
        try {
            const user = await User.findOne({ email: req.body.email });
             // If it doesn't throw, it should be null because no user has email "{}"
            expect(user).toBeNull();
        } catch (error) {
            expect(error.name).toBe('CastError');
        }
    });

    it('should sanitize nested objects', () => {
        const req = {
            body: {
                filters: {
                    price: { $gt: 100 }
                }
            },
            query: {},
            params: {}
        };
        const next = jest.fn();
        mongoSanitize(req, {}, next);
        expect(req.body.filters.price).toEqual({});
    });
});
