const mongoose = require('mongoose');
const connectDatabase = require('../../config/database');

jest.mock('mongoose', () => ({
    connect: jest.fn().mockResolvedValue({
        connection: {
            host: 'test-host'
        }
    })
}));

describe('connectDatabase', () => {
    let originalEnv;

    beforeAll(() => {
        originalEnv = process.env;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock console.log to avoid cluttering test output
        jest.spyOn(console, 'log').mockImplementation(() => {});
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    it('should connect to the database using process.env.DB_URI', async () => {
        process.env.DB_URI = 'mongodb://test-uri';

        await connectDatabase();

        expect(mongoose.connect).toHaveBeenCalledTimes(1);
        expect(mongoose.connect).toHaveBeenCalledWith('mongodb://test-uri');
        expect(console.log).toHaveBeenCalledWith('mongodb connected with server: test-host');
    });

    it('should pass through errors from mongoose.connect', async () => {
        process.env.DB_URI = 'mongodb://test-uri';
        const expectedError = new Error('Connection failed');
        mongoose.connect.mockRejectedValueOnce(expectedError);

        await expect(connectDatabase()).rejects.toThrow(expectedError);
        expect(console.log).not.toHaveBeenCalled();
    });
});
