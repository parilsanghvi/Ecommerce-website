const { sendStripeApiKey } = require('../../controllers/paymentController');

describe('Payment Controller - sendStripeApiKey', () => {
    let req, res, next;
    let originalStripeApiKey;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();

        // Save original env var
        originalStripeApiKey = process.env.STRIPE_API_KEY;
    });

    afterEach(() => {
        // Restore original env var
        if (originalStripeApiKey === undefined) {
            delete process.env.STRIPE_API_KEY;
        } else {
            process.env.STRIPE_API_KEY = originalStripeApiKey;
        }
    });

    it('should return stripe api key with status 200', async () => {
        const testApiKey = 'test_stripe_api_key_123';
        process.env.STRIPE_API_KEY = testApiKey;

        await sendStripeApiKey(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ stripeApiKey: testApiKey });
    });
});
