const mongoose = require('mongoose');
const connectDatabase = require('../../config/database');

jest.mock('mongoose');

describe('Database Connection', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = process.env.DB_URI;
        process.env.DB_URI = 'mongodb://localhost:27017/test';
        // Clear mocks before each test
        jest.clearAllMocks();

        // Mock console.log to prevent cluttering test output
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        if (originalEnv === undefined) {
            delete process.env.DB_URI;
        } else {
            process.env.DB_URI = originalEnv;
        }
        jest.restoreAllMocks();
    });

    it('should call mongoose.connect with DB_URI', async () => {
        // Setup mock resolved value for mongoose.connect
        mongoose.connect.mockResolvedValue({
            connection: {
                host: 'localhost'
            }
        });

        await connectDatabase();

        expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
        expect(console.log).toHaveBeenCalledWith('mongodb connected with server: localhost');
    });

    it('should throw an error if mongoose.connect fails', async () => {
        const error = new Error('Connection failed');
        mongoose.connect.mockRejectedValue(error);

        await expect(connectDatabase()).rejects.toThrow('Connection failed');
        expect(console.log).not.toHaveBeenCalled();
    });
});
