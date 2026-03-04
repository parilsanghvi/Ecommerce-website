const mongoose = require('mongoose');
const Product = require('../../models/productModel');
const Review = require('../../models/reviewModel');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function runBenchmark() {
    console.log('Starting Refactored Review Benchmark...');
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const product = await Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Test',
        stock: 10,
        ratings: 3.5,
        numOfReviews: 10000,
        user: new mongoose.Types.ObjectId()
    });

    // Add 10,000 reviews to the single product to simulate a popular item
    const NUM_REVIEWS = 10000;
    console.log(`Generating ${NUM_REVIEWS} reviews in separate collection...`);
    const reviews = [];
    for (let i = 0; i < NUM_REVIEWS; i++) {
        reviews.push({
            product: product._id,
            user: new mongoose.Types.ObjectId(),
            name: `User ${i}`,
            rating: Math.floor(Math.random() * 5) + 1,
            comment: `This is review number ${i}. It is a great product!`
        });
    }

    await Review.insertMany(reviews);

    console.log(`\n--- Benchmarking fetching product (reviews separate) ---`);

    // Fetch product
    const startProductFetch = performance.now();
    const doc = await Product.findById(product._id).lean();
    const endProductFetch = performance.now();

    // Size check
    const size = JSON.stringify(doc).length;

    console.log(`Fetch Document (no embedded reviews): ${(endProductFetch - startProductFetch).toFixed(2)} ms`);
    console.log(`Document Size: ${(size / 1024).toFixed(2)} KB`);

    // Simulating fetching single review by user (as seen in createReview logic)
    console.log(`\n--- Benchmarking updating/checking a review ---`);
    const searchUser = reviews[5000].user;

    const startSingleReview = performance.now();
    await Review.findOne({ product: product._id, user: searchUser });
    const endSingleReview = performance.now();
    console.log(`Find single review in ${NUM_REVIEWS} collection: ${(endSingleReview - startSingleReview).toFixed(2)} ms`);

    await mongoose.disconnect();
    await mongoServer.stop();
}

runBenchmark().catch(console.error);
