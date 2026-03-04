const mongoose = require('mongoose');
const Product = require('./models/productModel');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const productId = new mongoose.Types.ObjectId();
    const reviews = [];
    for (let i = 0; i < 5000; i++) {
        reviews.push({
            user: new mongoose.Types.ObjectId(),
            name: `User ${i}`,
            rating: Math.floor(Math.random() * 5) + 1,
            comment: `This is review number ${i} with some additional text to take up space.`
        });
    }

    const testProduct = await Product.create({
        _id: productId,
        name: 'Review Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Laptop',
        stock: 10,
        ratings: 0,
        numOfReviews: 5000,
        reviews: reviews,
        images: [{ public_id: 'pid', url: 'purl' }],
        user: new mongoose.Types.ObjectId()
    });

    console.time('No Pagination (Baseline)');
    const productNoPagi = await Product.findById(productId).select("reviews").lean();
    const allReviews = productNoPagi.reviews;
    console.timeEnd('No Pagination (Baseline)');
    console.log(`Retrieved ${allReviews.length} reviews`);

    // With Pagination
    console.time('With Pagination');

    // Default page and limit
    const page = 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // We can use $slice to paginate the embedded reviews array
    // $slice projection array: [skip, limit]
    const productPagi = await Product.findById(productId)
        .select({
            reviews: { $slice: [skip, limit] },
            numOfReviews: 1
        })
        .lean();

    const slicedReviews = productPagi.reviews;
    const totalReviews = productPagi.numOfReviews; // Note: we need to ensure this is returned

    console.timeEnd('With Pagination');
    console.log(`Retrieved ${slicedReviews.length} reviews out of ${totalReviews}`);

    await mongoose.disconnect();
    await mongoServer.stop();
}

run();
