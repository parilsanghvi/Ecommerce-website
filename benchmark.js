
const { performance } = require('perf_hooks');

// Simulation parameters
const IMAGE_COUNT = 5;
const UPLOAD_LATENCY_MS = 100;

// Mock Cloudinary Upload
const mockUpload = async (image) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                public_id: `id_${Math.random()}`,
                secure_url: `http://res.cloudinary.com/demo/image/upload/${Math.random()}.jpg`
            });
        }, UPLOAD_LATENCY_MS);
    });
};

// Sequential Approach
const runSequential = async () => {
    const start = performance.now();
    const images = new Array(IMAGE_COUNT).fill('base64data');
    const results = [];

    for (let i = 0; i < images.length; i++) {
        const result = await mockUpload(images[i]);
        results.push(result);
    }

    const end = performance.now();
    return end - start;
};

// Parallel Approach
const runParallel = async () => {
    const start = performance.now();
    const images = new Array(IMAGE_COUNT).fill('base64data');

    const results = await Promise.all(images.map(image => mockUpload(image)));

    const end = performance.now();
    return end - start;
};

const runBenchmark = async () => {
    console.log(`Running Benchmark: ${IMAGE_COUNT} images, ${UPLOAD_LATENCY_MS}ms latency per upload\n`);

    console.log("1. Running Sequential...");
    const seqTime = await runSequential();
    console.log(`   Time: ${seqTime.toFixed(2)}ms`);

    console.log("\n2. Running Parallel...");
    const parTime = await runParallel();
    console.log(`   Time: ${parTime.toFixed(2)}ms`);

    const speedup = seqTime / parTime;
    console.log(`\nResults: Parallel is ${speedup.toFixed(2)}x faster!`);
    console.log(`Expected theoretical time for sequential: ${IMAGE_COUNT * UPLOAD_LATENCY_MS}ms`);
    console.log(`Expected theoretical time for parallel: ~${UPLOAD_LATENCY_MS}ms`);
};

runBenchmark();
