const sendToken = require('../utils/jwtToken');

describe('JWT Token Security Verification', () => {
    let mockRes;
    let mockCookie;
    let mockJson;
    let mockStatus;

    beforeEach(() => {
        // Mock the Express response object correctly
        mockJson = jest.fn();
        mockCookie = jest.fn().mockReturnValue({ json: mockJson });
        mockStatus = jest.fn().mockReturnValue({ cookie: mockCookie });
        mockRes = { status: mockStatus };

        process.env.COOKIE_EXPIRE = '7';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should not leak the user password in the json response', () => {
        const mockUser = {
            _id: '12345',
            name: 'John Doe',
            email: 'john@example.com',
            password: 'hashedpassword123',
            getJWTToken: jest.fn().mockReturnValue('mocked-token-string')
        };

        // Call the function
        sendToken(mockUser, 200, mockRes);

        // Verify that res.status().cookie().json() was called correctly
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockCookie).toHaveBeenCalledWith('token', 'mocked-token-string', expect.any(Object));
        expect(mockJson).toHaveBeenCalledTimes(1);

        const responsePayload = mockJson.mock.calls[0][0];

        // Assert success and basic user properties are present
        expect(responsePayload.success).toBe(true);
        expect(responsePayload.user).toBeDefined();
        expect(responsePayload.user._id).toBe('12345');
        expect(responsePayload.user.name).toBe('John Doe');

        // Security check: Assert that the password has been stripped out
        expect(responsePayload.user.password).toBeUndefined();
    });

    it('should work fine if user object has no password field', () => {
        const mockUser = {
            _id: '67890',
            name: 'Jane Smith',
            email: 'jane@example.com',
            getJWTToken: jest.fn().mockReturnValue('another-token')
        };

        sendToken(mockUser, 200, mockRes);

        const responsePayload = mockJson.mock.calls[0][0];
        expect(responsePayload.success).toBe(true);
        expect(responsePayload.user._id).toBe('67890');
        expect(responsePayload.user.password).toBeUndefined();
    });
});
