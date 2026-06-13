const sendEmail = require('../../utils/sendEmail');
// We need to mock 'resend' package
const { Resend } = require('resend');

const mockSend = jest.fn().mockResolvedValue({ id: 'test_id' });

jest.mock('resend', () => {
    return {
        Resend: jest.fn().mockImplementation(() => {
            return {
                emails: {
                    send: mockSend,
                },
            };
        }),
    };
});

describe('Utils: sendEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSend.mockResolvedValue({ id: 'test_id' }); // reset default
    });

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
        expect(mockSend).toHaveBeenCalledWith({
            from: 'onboarding@resend.dev',
            to: options.email,
            subject: options.subject,
            text: options.message,
        });
    });

    it('should throw an error if email sending fails', async () => {
        mockSend.mockRejectedValueOnce(new Error('Resend API error'));

        // Suppress console.error for this test to avoid polluting test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const options = {
            email: 'test@example.com',
            subject: 'Test Subject',
            message: 'Test Message',
        };

        await expect(sendEmail(options)).rejects.toThrow('Email sending failed');

        consoleSpy.mockRestore();
    });
});
