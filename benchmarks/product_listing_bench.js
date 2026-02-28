const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../backend/models/productModel');
const Apifeatures = require('../backend/utils/apifeatures');

async function runBenchmark() {
    let mongoServer;
    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log("Connected to In-Memory DB");

        // Seed 1000 products
        const products = [];
        const userId = new mongoose.Types.ObjectId();
        for (let i = 0; i < 1000; i++) {
            products.push({
                name: `Product ${i}`,
                description: "Description",
                price: Math.floor(Math.random() * 1000),
                category: "Test",
                stock: 10,
                images: [{ public_id: "id", url: "url" }],
                user: userId,
                reviews: [],
                ratings: 0,
                numOfReviews: 0
            });
        }
        await Product.insertMany(products);
        console.log("Seeded 1000 products");

        const reqQuery = { keyword: "Product" };
        const resultPerPage = 8;
        const iterations = 50;

        // --- Sequential Measurement ---
        console.log("Starting Sequential Measurement...");
        const startSeq = performance.now();
        for (let i = 0; i < iterations; i++) {
            const apifeature = new Apifeatures(Product.find(), reqQuery)
                .search()
                .filter();

            let filteredProductsCount = await apifeature.query.clone().countDocuments();
            apifeature.pagiNation(resultPerPage);
            const products = await apifeature.query.select("-reviews").lean();
        }
        const endSeq = performance.now();
        const seqTime = endSeq - startSeq;
        console.log(`Sequential took: ${seqTime.toFixed(2)} ms`);

        // --- Parallel Measurement ---
        console.log("Starting Parallel Measurement...");
        const startPar = performance.now();
        for (let i = 0; i < iterations; i++) {
            const apifeature = new Apifeatures(Product.find(), reqQuery)
                .search()
                .filter();

            const countPromise = apifeature.query.clone().countDocuments();

            apifeature.pagiNation(resultPerPage);

            const productsPromise = apifeature.query.select("-reviews").lean();

            await Promise.all([countPromise, productsPromise]);
        }
        const endPar = performance.now();
        const parTime = endPar - startPar;
        console.log(`Parallel took: ${parTime.toFixed(2)} ms`);

        // Report
        console.log(`Improvement: ${(seqTime - parTime).toFixed(2)} ms`);
        console.log(`Speedup: ${(seqTime / parTime).toFixed(2)}x`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        if (mongoServer) await mongoServer.stop();
    }
}

runBenchmark();
