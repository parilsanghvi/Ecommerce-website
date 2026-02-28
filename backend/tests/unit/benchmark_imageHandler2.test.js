const { processImagesUpdate } = require('../../utlis/imageHandler');
const cloudinary = require('cloudinary');

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn(),
        },
    },
}));

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('processImagesUpdate benchmark', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('benchmark execution time - concurrent delete and upload', async () => {
        const currentImages = Array.from({ length: 10 }, (_, i) => ({ public_id: `old_id${i}`, url: `http://old.com/img${i}.jpg` }));
        const newImagesInput = Array.from({ length: 10 }, (_, i) => `data:image/jpeg;base64,new_image_data${i}`);

        // Mock destroy to take 100ms
        cloudinary.v2.uploader.destroy.mockImplementation(async () => {
            await sleep(100);
            return { result: 'ok' };
        });

        // Mock upload to take 100ms
        cloudinary.v2.uploader.upload.mockImplementation(async () => {
            await sleep(100);
            return {
                public_id: 'new_id',
                secure_url: 'http://new.com/img.jpg',
            };
        });

        const start = Date.now();
        await processImagesUpdate(currentImages, newImagesInput);
        const end = Date.now();

        console.log(`Execution time concurrent: ${end - start}ms`);
        // If it runs concurrently, the time should be around 100ms instead of 200ms
        expect(end - start).toBeLessThan(150);
    });
});
