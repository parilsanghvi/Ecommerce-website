
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../backend/models/userModel'); // Adjust path as needed

// Mock environment variables needed by User model if any (e.g. JWT_SECRET)
process.env.JWT_SECRET = "test_secret";
process.env.JWT_EXPIRE = "5d";

async function runBenchmark() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);

  // Create a dummy user
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    avatar: {
      public_id: "test_id",
      url: "test_url"
    }
  });

  const userId = user._id;
  const iterations = 5000;

  console.log(`Starting benchmark with ${iterations} iterations...`);

  // Measure Baseline: findById without lean
  const startBaseline = performance.now();
  for (let i = 0; i < iterations; i++) {
    await User.findById(userId);
  }
  const endBaseline = performance.now();
  const baselineTime = endBaseline - startBaseline;

  // Measure Optimization: findById with lean and select
  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    await User.findById(userId).select("name email role avatar _id createdAt").lean();
  }
  const endOptimized = performance.now();
  const optimizedTime = endOptimized - startOptimized;

  console.log(`Baseline (findById): ${baselineTime.toFixed(2)}ms`);
  console.log(`Optimized (lean + select): ${optimizedTime.toFixed(2)}ms`);
  console.log(`Improvement: ${((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2)}%`);

  await mongoose.disconnect();
  await mongod.stop();
}

runBenchmark().catch(console.error);
