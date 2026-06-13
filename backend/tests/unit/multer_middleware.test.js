let mockMemoryStorage;
let mockMulterCall;

jest.mock('multer', () => {
  mockMemoryStorage = jest.fn(() => 'mocked_storage');
  mockMulterCall = jest.fn(() => 'mocked_upload');

  const multerMock = function(options) {
      return mockMulterCall(options);
  };

  multerMock.memoryStorage = mockMemoryStorage;

  return multerMock;
});

const multer = require('multer');

describe('Multer Middleware Configuration', () => {
    let upload;

    beforeEach(() => {
        jest.clearAllMocks();

        // Isolate module to ensure it runs every time and calls the mocked multer
        jest.isolateModules(() => {
            upload = require('../../middleware/multer');
        });
    });

    it('should configure multer with memoryStorage', () => {
        expect(mockMemoryStorage).toHaveBeenCalled();
    });

    it('should set file size limit to 50MB', () => {
        expect(mockMulterCall).toHaveBeenCalledWith({
            storage: 'mocked_storage',
            limits: { fileSize: 50 * 1024 * 1024 }
        });
    });

    it('should export the upload middleware', () => {
        expect(upload).toBe('mocked_upload');
    });
});
