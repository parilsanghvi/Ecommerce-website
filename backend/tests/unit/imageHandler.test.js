
jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn(),
        },
    },
}));

const { processImagesUpdate } = require('../../utils/imageHandler');
const cloudinary = require('cloudinary');

describe('processImagesUpdate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete all existing images if input is an empty array', async () => {
        const currentImages = [
            { public_id: 'old_id1', url: 'http://old.com/img1.jpg' },
            { public_id: 'old_id2', url: 'http://old.com/img2.jpg' },
        ];
        const newImagesInput = [];

        cloudinary.v2.uploader.destroy.mockResolvedValue({ result: 'ok' });

        const result = await processImagesUpdate(currentImages, newImagesInput);

        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledTimes(2);
        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('old_id1');
        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('old_id2');
        expect(result).toEqual([]);
    });

    it('should keep specified existing images and delete removed ones', async () => {
        const currentImages = [
            { public_id: 'old_id1', url: 'http://old.com/img1.jpg' },
            { public_id: 'old_id2', url: 'http://old.com/img2.jpg' },
        ];
        const newImagesInput = ['http://old.com/img1.jpg'];

        cloudinary.v2.uploader.destroy.mockResolvedValue({ result: 'ok' });

        const result = await processImagesUpdate(currentImages, newImagesInput);

        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledTimes(1);
        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('old_id2');
        expect(result).toEqual([{ public_id: 'old_id1', url: 'http://old.com/img1.jpg' }]);
    });

    it('should upload new images and keep existing ones', async () => {
        const currentImages = [
            { public_id: 'old_id1', url: 'http://old.com/img1.jpg' },
        ];
        const newImagesInput = ['http://old.com/img1.jpg', 'data:image/jpeg;base64,new_image_data'];

        cloudinary.v2.uploader.destroy.mockResolvedValue({ result: 'ok' });
        cloudinary.v2.uploader.upload.mockResolvedValue({
            public_id: 'new_id',
            secure_url: 'http://new.com/img.jpg',
        });

        const result = await processImagesUpdate(currentImages, newImagesInput);

        expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
        expect(cloudinary.v2.uploader.upload).toHaveBeenCalledTimes(1);
        expect(cloudinary.v2.uploader.upload).toHaveBeenCalledWith('data:image/jpeg;base64,new_image_data', { folder: 'products' });

        expect(result).toEqual([
            { public_id: 'old_id1', url: 'http://old.com/img1.jpg' },
            { public_id: 'new_id', url: 'http://new.com/img.jpg' },
        ]);
    });

    it('should handle single string input (normalize to array)', async () => {
        const currentImages = [
            { public_id: 'old_id1', url: 'http://old.com/img1.jpg' },
        ];
        const newImagesInput = 'data:image/jpeg;base64,new_image_data';

        cloudinary.v2.uploader.destroy.mockResolvedValue({ result: 'ok' });
        cloudinary.v2.uploader.upload.mockResolvedValue({
            public_id: 'new_id',
            secure_url: 'http://new.com/img.jpg',
        });

        const result = await processImagesUpdate(currentImages, newImagesInput);

        expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledTimes(1);
        expect(cloudinary.v2.uploader.upload).toHaveBeenCalledTimes(1);
        expect(result).toEqual([{ public_id: 'new_id', url: 'http://new.com/img.jpg' }]);
    });
});
