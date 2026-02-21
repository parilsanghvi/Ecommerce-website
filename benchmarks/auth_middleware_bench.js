const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    avatar: {
        public_id: String,
        url: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('UserBench', userSchema);

async function runBenchmark() {
    console.log("Setting up benchmark...");
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        role: "user",
        avatar: { public_id: "id", url: "url" }
    });

    const iterations = 5000;

    // Warmup
    for (let i = 0; i < 100; i++) {
        await User.findById(user._id);
    }

    console.log(`Starting benchmark with ${iterations} iterations...`);

    const startStandard = performance.now();
    for (let i = 0; i < iterations; i++) {
        await User.findById(user._id);
    }
    const endStandard = performance.now();
    const timeStandard = endStandard - startStandard;

    console.log(`Standard Mongoose Document: ${timeStandard.toFixed(2)}ms`);

    const startLean = performance.now();
    for (let i = 0; i < iterations; i++) {
        await User.findById(user._id).select("name email role avatar _id createdAt").lean();
    }
    const endLean = performance.now();
    const timeLean = endLean - startLean;

    console.log(`Lean POJO (optimized): ${timeLean.toFixed(2)}ms`);
    console.log(`Improvement: ${((timeStandard - timeLean) / timeStandard * 100).toFixed(2)}%`);

    await mongoose.disconnect();
    await mongoServer.stop();
}

runBenchmark().catch(console.error);
