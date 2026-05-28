jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn(),
            upload: jest.fn(),
        },
    },
}));

const { processImages } = require('../../utils/imageHandler');
const cloudinary = require('cloudinary');

describe('processImages unit tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Scenario 1: Handling of multipart file uploads (files array is present)', async () => {
        const mockFiles = [
            { buffer: Buffer.from('test1') },
            { buffer: Buffer.from('test2') }
        ];

        cloudinary.v2.uploader.upload_stream.mockImplementation((options, callback) => {
            return {
                end: jest.fn(() => {
                    callback(null, { public_id: 'test_id', secure_url: 'http://test.com/img.jpg' });
                })
            };
        });

        const result = await processImages(mockFiles, null);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ public_id: 'test_id', url: 'http://test.com/img.jpg' });
        expect(result[1]).toEqual({ public_id: 'test_id', url: 'http://test.com/img.jpg' });
        expect(cloudinary.v2.uploader.upload_stream).toHaveBeenCalledTimes(2);
    });

    it('Scenario 2: Error handling in multipart file uploads', async () => {
        const mockFiles = [
            { buffer: Buffer.from('test1') }
        ];

        cloudinary.v2.uploader.upload_stream.mockImplementation((options, callback) => {
            return {
                end: jest.fn(() => {
                    callback(new Error('Upload error'), null);
                })
            };
        });

        await expect(processImages(mockFiles, null)).rejects.toThrow('Upload error');
        expect(cloudinary.v2.uploader.upload_stream).toHaveBeenCalledTimes(1);
    });

    it('Scenario 3: Handling of base64 fallback with a single string', async () => {
        cloudinary.v2.uploader.upload.mockResolvedValue({
            public_id: 'base64_id',
            secure_url: 'http://test.com/base64.jpg'
        });

        const bodyImages = "data:image/jpeg;base64,string1";

        const result = await processImages(null, bodyImages);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ public_id: 'base64_id', url: 'http://test.com/base64.jpg' });
        expect(cloudinary.v2.uploader.upload).toHaveBeenCalledTimes(1);
        expect(cloudinary.v2.uploader.upload).toHaveBeenCalledWith("data:image/jpeg;base64,string1", expect.any(Object));
    });

    it('Scenario 4: Handling of base64 fallback with an array of strings', async () => {
        cloudinary.v2.uploader.upload.mockResolvedValueOnce({
            public_id: 'base64_id_1',
            secure_url: 'http://test.com/base64_1.jpg'
        }).mockResolvedValueOnce({
            public_id: 'base64_id_2',
            secure_url: 'http://test.com/base64_2.jpg'
        });

        const bodyImages = [
            "data:image/jpeg;base64,string1",
            "data:image/jpeg;base64,string2"
        ];

        const result = await processImages([], bodyImages);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ public_id: 'base64_id_1', url: 'http://test.com/base64_1.jpg' });
        expect(result[1]).toEqual({ public_id: 'base64_id_2', url: 'http://test.com/base64_2.jpg' });
        expect(cloudinary.v2.uploader.upload).toHaveBeenCalledTimes(2);
    });

    it('Scenario 5: Handling of empty input', async () => {
        const result1 = await processImages(null, null);
        expect(result1).toEqual([]);

        const result2 = await processImages([], []);
        expect(result2).toEqual([]);

        expect(cloudinary.v2.uploader.upload_stream).not.toHaveBeenCalled();
        expect(cloudinary.v2.uploader.upload).not.toHaveBeenCalled();
    });
});
