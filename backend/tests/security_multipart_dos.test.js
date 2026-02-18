const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");

// We don't need a real DB connection because we expect the controller to fail early (401)
// or Multer to fail even earlier (500).

describe("Security: Multipart DoS Protection", () => {

    test("should REJECT file uploads to /register endpoint", async () => {
        const response = await request(app)
            .post("/api/v1/register")
            .field("name", "Test User")
            .field("email", "test@example.com")
            .field("password", "password123")
            // sending file named 'avatar'
            .attach("avatar", Buffer.from("fake image"), "avatar.jpg");

        // Fixed behavior: Multer throws error before controller.
        // Error is "Unexpected field" (MulterError).
        // App error handler returns 500.

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/Unexpected field/);
    });

    test("should ALLOW valid text-only multipart registration (base64 avatar)", async () => {
        // Mock Cloudinary to avoid actual upload attempts if possible,
        // but here we just check Multer didn't block it.

        const response = await request(app)
            .post("/api/v1/register")
            .field("name", "Test User")
            .field("email", "test@example.com")
            .field("password", "password123")
            // sending avatar as text field (base64)
            .field("avatar", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

        // Should NOT be "Unexpected field".
        if (response.body && response.body.message && response.body.message.includes("Unexpected field")) {
             throw new Error("Legitimate text-only multipart request was rejected!");
        }

        // We expect it to proceed past Multer.
        // It will likely fail due to Cloudinary config missing or DB connection missing.
        // But not "Unexpected field".
    });
});
