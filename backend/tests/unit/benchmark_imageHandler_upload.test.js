const { processImages } = require('../../utils/imageHandler');
const cloudinary = require('cloudinary');

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn(),
            upload: jest.fn()
        },
    },
}));

describe('processImages benchmark', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('benchmark execution time - base64 uploads', async () => {
        const newImagesInput = Array.from({ length: 10 }, (_, i) => `data:image/jpeg;base64,new_image_data${i}`);

        // Mock upload to be instant so we measure synchronous code
        cloudinary.v2.uploader.upload.mockImplementation(async () => {
            return {
                public_id: 'new_id',
                secure_url: 'http://new.com/img.jpg',
            };
        });

        const start = Date.now();
        await processImages(null, newImagesInput);
        const end = Date.now();

        console.log(`Execution time base64: ${end - start}ms`);
    });
});
