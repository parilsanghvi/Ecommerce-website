const userController = require('../../controllers/userController');
const User = require('../../models/userModel');
const cloudinary = require('cloudinary');
const { performance } = require('perf_hooks');

// Mock dependencies
jest.mock('../../models/userModel');
jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            destroy: jest.fn(),
            upload: jest.fn(),
        }
    }
}));
// Mock catchAsyncErrors to execute the function directly so we can test it
jest.mock('../../middleware/catchAsyncErrors', () => (func) => (req, res, next) => {
    return Promise.resolve(func(req, res, next)).catch(next);
});

describe('updateProfile Performance Benchmark', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: {
                id: 'user123',
                _id: 'user123',
                avatar: {
                    public_id: 'old_public_id',
                    url: 'old_url'
                }
            },
            body: {
                name: 'New Name',
                email: 'new@example.com',
                avatar: 'data:image/png;base64,newavatar'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('benchmarks avatar update speed', async () => {
        // Simulate network latency for cloudinary operations
        cloudinary.v2.uploader.destroy.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ result: 'ok' }), 50)));
        cloudinary.v2.uploader.upload.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
            public_id: 'new_public_id',
            secure_url: 'new_secure_url'
        }), 100)));

        User.findByIdAndUpdate.mockResolvedValue({});

        const iterations = 5;
        let totalTime = 0;

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await userController.updateProfile(req, res, next);
            const end = performance.now();
            totalTime += (end - start);
        }

        const avgTime = totalTime / iterations;
        console.log(`Average updateProfile time: ${avgTime.toFixed(2)}ms`);

        // Ensure the simulated time is represented
        expect(avgTime).toBeGreaterThan(100);
    });
});
