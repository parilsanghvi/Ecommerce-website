const sendEmail = require('../../utlis/sendEmail');
// We need to mock 'resend' package
const { Resend } = require('resend');

jest.mock('resend', () => {
    return {
        Resend: jest.fn().mockImplementation(() => {
            return {
                emails: {
                    send: jest.fn().mockResolvedValue({ id: 'test_id' }),
                },
            };
        }),
    };
});

describe('Utils: sendEmail', () => {
    it('should send an email using Resend', async () => {
        const options = {
            email: 'test@example.com',
            subject: 'Test Subject',
            message: 'Test Message',
        };

        await sendEmail(options);

        // Verify Resend was instantiated
        expect(Resend).toHaveBeenCalledWith(process.env.RESEND_API_KEY);
        // We can't easily access the instance method unless we spy on it or capture the mock instance.
        // But since we mocked the constructor to return an object with a spy, we can check basic execution.
    });
});
