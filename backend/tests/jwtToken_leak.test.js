const sendToken = require("../utils/jwtToken");

describe("jwtToken Leak", () => {
    it("strips password from user object", () => {
        const user = {
            _id: "123",
            name: "Test",
            email: "test@test.com",
            password: "hashedpassword",
            getJWTToken: () => "mocktoken"
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        sendToken(user, 200, res);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            user: expect.not.objectContaining({ password: "hashedpassword" })
        });
    });
});
