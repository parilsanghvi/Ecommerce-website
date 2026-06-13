jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn(),
            upload: jest.fn(),
        },
    },
}));

const { uploadImage } = require('../../utils/imageUpload');
const cloudinary = require('cloudinary');

describe('uploadImage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should upload a buffer successfully', async () => {
        const file = { buffer: Buffer.from('test') };
        cloudinary.v2.uploader.upload_stream.mockImplementation((options, cb) => {
            return {
                end: () => cb(null, { public_id: 'buf_id', secure_url: 'http://buf.url' })
            };
        });

        const result = await uploadImage(file, 'test_folder');
        expect(result).toEqual({ public_id: 'buf_id', url: 'http://buf.url' });
        expect(cloudinary.v2.uploader.upload_stream).toHaveBeenCalledTimes(1);
    });

    it('should handle buffer upload error', async () => {
        const file = { buffer: Buffer.from('test') };
        const uploadError = new Error('upload failed');
        cloudinary.v2.uploader.upload_stream.mockImplementation((options, cb) => {
            return {
                end: () => cb(uploadError, null)
            };
        });

        await expect(uploadImage(file, 'test_folder')).rejects.toThrow('upload failed');
    });

    it('should upload a string successfully', async () => {
        const file = 'data:image/jpeg;base64,test';
        cloudinary.v2.uploader.upload.mockResolvedValue({
            public_id: 'str_id',
            secure_url: 'http://str.url'
        });

        const result = await uploadImage(file, 'test_folder');
        expect(result).toEqual({ public_id: 'str_id', url: 'http://str.url' });
        expect(cloudinary.v2.uploader.upload).toHaveBeenCalledWith(file, expect.objectContaining({ folder: 'test_folder' }));
    });

    it('should handle string upload error', async () => {
        const file = 'data:image/jpeg;base64,test';
        const uploadError = new Error('string upload failed');
        cloudinary.v2.uploader.upload.mockRejectedValue(uploadError);

        await expect(uploadImage(file, 'test_folder')).rejects.toThrow('string upload failed');
    });

    it('should reject invalid file format', async () => {
        const file = { invalid: 'format' };
        await expect(uploadImage(file, 'test_folder')).rejects.toThrow('Invalid file format. Expected buffer or string.');
    });
});
