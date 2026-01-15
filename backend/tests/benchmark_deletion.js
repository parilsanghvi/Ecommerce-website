const path = require('path');

// Counters for verification
let destroyCalls = 0;

// Mocks
const mockCloudinary = {
    v2: {
        uploader: {
            destroy: async (public_id) => {
                destroyCalls++;
                // Simulate network latency of 100ms
                return new Promise(resolve => setTimeout(resolve, 100));
            },
            upload: async (image, options) => {
                return { public_id: 'new_id', secure_url: 'new_url' };
            }
        }
    }
};

const mockProduct = {
    images: Array.from({ length: 5 }, (_, i) => ({ public_id: `img_${i}`, url: `url_${i}` })),
};

const mockProductModel = {
    findById: async (id) => {
        return mockProduct;
    },
    findByIdAndUpdate: async (id, data, options) => {
        return { ...mockProduct, ...data };
    }
};

const mockCatchAsyncErrors = (fn) => fn;

class MockErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// Apply mocks to require cache
// Mock Cloudinary
try {
    const cloudinaryPath = require.resolve('cloudinary');
    require.cache[cloudinaryPath] = { exports: mockCloudinary };
} catch (e) {
    // If cloudinary is not installed in this environment, we might need to mock the path manually if we knew it.
    // But since require('cloudinary') works in the controller, it must be resolvable.
    // However, in case require.resolve fails (e.g. if we are in a weird env), we might have issues.
    // Assuming standard node resolution.
    console.log("Cloudinary resolved at: " + require.resolve('cloudinary'));
    require.cache[require.resolve('cloudinary')] = { exports: mockCloudinary };
}

// Mock Local Files
const productModelPath = path.resolve(__dirname, '../models/productModel.js');
require.cache[productModelPath] = { exports: mockProductModel };

const catchAsyncErrorsPath = path.resolve(__dirname, '../middleware/catchAsyncErrors.js');
require.cache[catchAsyncErrorsPath] = { exports: mockCatchAsyncErrors };

const errorHandlerPath = path.resolve(__dirname, '../utlis/errorhandler.js');
require.cache[errorHandlerPath] = { exports: MockErrorHandler };


// Load controller
const productController = require('../controllers/productController');

// Helper to run test
async function runTest() {
    const req = {
        params: { id: '123' },
        body: {
            images: 'new_image_data' // Trigger the update logic
        },
        user: { id: 'user1' }
    };
    const res = {
        status: (code) => ({
            json: (data) => {
                // console.log('Response received');
            }
        })
    };
    const next = (err) => {
        console.error('Next called with error:', err);
    };

    console.log('Starting benchmark...');
    const start = Date.now();

    await productController.updateProduct(req, res, next);

    const end = Date.now();
    const duration = end - start;

    console.log(`Execution time: ${duration}ms`);
    console.log(`Destroy calls: ${destroyCalls}`);

    // Verification logic for the script itself to pass/fail if needed
    if (destroyCalls !== 5) {
        console.error('FAILED: Expected 5 destroy calls.');
        process.exit(1);
    }
}

runTest();
