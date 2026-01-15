const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../backend/models/productModel');

dotenv.config({ path: "backend/config/config.env" });

const connectDatabase = async () => {
    if (process.env.DB_URI) {
        return mongoose.connect(process.env.DB_URI);
    } else {
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        console.log("Using In-Memory Mongo:", uri);
        return mongoose.connect(uri);
    }
};

// Replicate the controller logic
async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    if (product) {
        product.stock = product.stock - quantity;
        await product.save({
            validateBeforeSave: false
        });
    }
}

const runBenchmark = async () => {
    try {
        await connectDatabase();
        console.log("Connected to DB");

        // Create 20 dummy products
        const products = [];
        const userId = new mongoose.Types.ObjectId();
        for (let i = 0; i < 20; i++) {
            products.push({
                name: `Bench Product ${i}`,
                description: "Desc",
                price: 100,
                images: [{ public_id: "id", url: "url" }],
                category: "Test",
                stock: 100,
                user: userId, // Fake user ID
            });
        }

        const createdProducts = await Product.insertMany(products);
        console.log(`Created ${createdProducts.length} dummy products`);

        const orderItems = createdProducts.map(p => ({
            product: p._id,
            quantity: 1
        }));

        // Measure Sequential
        console.log("Starting Sequential Update (for...of)...");
        const startSeq = performance.now();
        for (const item of orderItems) {
            await updateStock(item.product, item.quantity);
        }
        const endSeq = performance.now();
        console.log(`Sequential took: ${(endSeq - startSeq).toFixed(2)} ms`);

        // Reset Stock for fair test
        await Promise.all(createdProducts.map(async (p) => {
            await Product.findByIdAndUpdate(p._id, { stock: 100 });
        }));
        console.log("Reset stock for Parallel test");

        // Measure Parallel
        console.log("Starting Parallel Update (Promise.all)...");
        const startPar = performance.now();
        await Promise.all(orderItems.map(async (item) => {
            await updateStock(item.product, item.quantity);
        }));
        const endPar = performance.now();
        console.log(`Parallel took: ${(endPar - startPar).toFixed(2)} ms`);

        // Calculate Improvement
        const improvement = ((endSeq - startSeq) - (endPar - startPar));
        console.log(`Improvement: ${improvement.toFixed(2)} ms`);
        console.log(`Speedup: ${(endSeq - startSeq) / (endPar - startPar)}x`);

        // Cleanup
        await Product.deleteMany({ _id: { $in: createdProducts.map(p => p._id) } });
        console.log("Cleaned up products");

        process.exit(0);
    } catch (err) {
        console.error("Benchmark failed:", err);
        process.exit(1);
    }
};

runBenchmark();
