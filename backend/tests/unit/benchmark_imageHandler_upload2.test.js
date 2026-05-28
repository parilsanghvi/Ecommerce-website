jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn(),
            upload: jest.fn()
        },
    },
}));

const { processImages } = require('../../utils/imageHandler');
const cloudinary = require('cloudinary');

describe('processImages benchmark', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('benchmark execution time - stream uploads', async () => {
        const files = Array.from({ length: 10 }, (_, i) => ({ buffer: Buffer.from(`new_image_data${i}`) }));

        // Mock upload_stream to be instant so we measure synchronous code
        cloudinary.v2.uploader.upload_stream.mockImplementation((opts, cb) => {
            return {
                end: (buffer) => {
                    cb(null, {
                        public_id: 'new_id',
                        secure_url: 'http://new.com/img.jpg',
                    });
                }
            };
        });

        const start = Date.now();
        await processImages(files, null);
        const end = Date.now();

        console.log(`Execution time stream: ${end - start}ms`);
    });
});
