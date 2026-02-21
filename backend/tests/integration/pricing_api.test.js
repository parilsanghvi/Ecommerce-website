const request = require("supertest");
const app = require("../../app");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../../models/userModel");
const jwt = require("jsonwebtoken");

describe("Pricing API Integration", () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // Helper to get token
    const getToken = (id) => {
        return jwt.sign({ id }, process.env.JWT_SECRET || "secret", {
            expiresIn: process.env.JWT_EXPIRE || "5d",
        });
    };

    it("should return pricing details for authenticated user", async () => {
        const user = await User.create({
            name: "Test User",
            email: "test@example.com",
            password: "password",
            avatar: { public_id: "id", url: "url" }
        });

        const token = getToken(user._id);

        const itemsPrice = 500;
        const response = await request(app)
            .get(`/api/v1/pricing?itemsPrice=${itemsPrice}`)
            .set("Cookie", [`token=${token}`]);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.taxPrice).toBe(500 * 0.18);
        expect(response.body.shippingPrice).toBe(200);
        expect(response.body.totalPrice).toBe(500 + 90 + 200);
    });

    it("should handle free shipping threshold", async () => {
         const user = await User.findOne({ email: "test@example.com" });
         const token = getToken(user._id);

         const itemsPrice = 1500;
         const response = await request(app)
             .get(`/api/v1/pricing?itemsPrice=${itemsPrice}`)
             .set("Cookie", [`token=${token}`]);

         expect(response.status).toBe(200);
         expect(response.body.shippingPrice).toBe(0);
    });

    it("should fail if not authenticated", async () => {
        const response = await request(app)
            .get(`/api/v1/pricing?itemsPrice=500`);

        // Depending on auth middleware, it returns 401 or redirects.
        // Usually 401.
        // Wait, isAuthenticatedUser returns next(new ErrorHandler("Please Login to access this resource", 401));
        expect(response.status).toBe(401);
    });
});
