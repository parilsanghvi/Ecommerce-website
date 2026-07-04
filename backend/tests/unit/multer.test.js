const multer = require('multer');

// Mock multer
jest.mock('multer', () => {
    // Create a mock function that simulates the multer constructor
    const m = jest.fn().mockImplementation((config) => {
        return {
            config, // expose config to verify it in tests
            single: jest.fn(),
            array: jest.fn()
        };
    });

    // Add memoryStorage as a property to the mock function
    m.memoryStorage = jest.fn().mockReturnValue('mock-memory-storage');

    return m;
});

describe('Multer Middleware Configuration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should configure multer with memoryStorage and 50MB file size limit', () => {
        // Need to require the actual mocked multer instance
        const mockedMulter = require('multer');

        // Require the file, which executes the configuration code
        const upload = require('../../middleware/multer');

        expect(mockedMulter.memoryStorage).toHaveBeenCalledTimes(1);

        expect(mockedMulter).toHaveBeenCalledTimes(1);
        expect(mockedMulter).toHaveBeenCalledWith({
            storage: 'mock-memory-storage',
            limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
        });

        expect(upload.config.limits.fileSize).toBe(50 * 1024 * 1024);
        expect(upload.config.storage).toBe('mock-memory-storage');
    });
});
