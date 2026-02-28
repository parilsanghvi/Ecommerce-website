const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../backend/models/productModel');
const Apifeatures = require('../backend/utils/apifeatures');

const NUM_PRODUCTS = 10000;
const CATEGORIES = ["Laptop", "Footwear", "Bottom", "Tops", "Attire", "Camera", "SmartPhones"];

async function runBenchmark() {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Insert products
    console.log(`Inserting ${NUM_PRODUCTS} products...`);
    const products = [];
    for (let i = 0; i < NUM_PRODUCTS; i++) {
        products.push({
            name: `Product ${i}`,
            price: 100,
            description: `Description ${i}`,
            category: CATEGORIES[i % CATEGORIES.length],
            images: [{ public_id: 'test', url: 'test' }],
            user: new mongoose.Types.ObjectId(),
            createdAt: new Date()
        });
    }
    await Product.insertMany(products);
    await Product.ensureIndexes();
    console.log("Indexes built.");

    const ITERATIONS = 1000;

    // Test case: User searches for "laptop" (lowercase) which should match "Laptop" (canonical)
    // In old implementation: regex search "laptop", options "i"
    // In new implementation: exact search "Laptop"

    const queryStr = { category: "laptop" };

    // We can't easily swap implementations here without mocking or rewriting the file.
    // So we will just measure the CURRENT implementation's performance.
    // Since we already applied the optimization, this will measure the OPTIMIZED performance.
    // We can compare it mentally to the baseline we established earlier (Regex was ~88ms/query).

    const start = process.hrtime();
    for (let i = 0; i < ITERATIONS; i++) {
        const feature = new Apifeatures(Product.find(), queryStr);
        feature.filter();
        await feature.query;
    }
    const end = process.hrtime(start);
    const time = (end[0] * 1000 + end[1] / 1e6).toFixed(2);

    console.log(`Optimized Search Time (${ITERATIONS} runs): ${time} ms`);
    console.log(`Average per query: ${(time / ITERATIONS).toFixed(2)} ms`);

    // Verify fallback for unknown category
    const unknownStart = process.hrtime();
    const unknownQueryStr = { category: "Unknown" }; // Should fallback to regex
    for (let i = 0; i < ITERATIONS; i++) {
        const feature = new Apifeatures(Product.find(), unknownQueryStr);
        feature.filter();
        await feature.query;
    }
    const unknownEnd = process.hrtime(unknownStart);
    const unknownTime = (unknownEnd[0] * 1000 + unknownEnd[1] / 1e6).toFixed(2);

    console.log(`Fallback (Regex) Search Time (${ITERATIONS} runs): ${unknownTime} ms`);

    await mongoose.disconnect();
    await mongoServer.stop();
}

runBenchmark().catch(console.error);
