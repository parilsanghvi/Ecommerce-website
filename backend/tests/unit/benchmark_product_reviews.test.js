const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../../models/productModel');

describe('Benchmark: Product Reviews Concurrency Issue Resolution', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should calculate ratings concurrently', async () => {
        const product = await Product.create({
            name: 'Test Product',
            price: 100,
            description: 'Test description',
            category: 'Electronics',
            stock: 10,
            user: new mongoose.Types.ObjectId(),
            ratings: 0,
            numOfReviews: 0,
            reviews: []
        });

        const users = Array.from({ length: 50 }, () => new mongoose.Types.ObjectId());

        // Simulating the concurrency issue resolution in the controller
        const addReview = async (user, rating) => {
            const p = await Product.findOne(
                { _id: product._id },
                { ratings: 1, numOfReviews: 1, reviews: { $elemMatch: { user: user } } }
            ).lean();

            const isReviewed = p.reviews && p.reviews.length > 0;

            if (isReviewed) {
                await Product.updateOne(
                    { _id: product._id, "reviews.user": user },
                    [
                        {
                            $set: {
                                "reviews": {
                                    $map: {
                                        input: "$reviews",
                                        as: "r",
                                        in: {
                                            $cond: [
                                                { $eq: ["$$r.user", user] },
                                                {
                                                    user: "$$r.user",
                                                    name: "$$r.name",
                                                    rating: Number(rating),
                                                    comment: "test"
                                                },
                                                "$$r"
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $set: {
                                ratings: { $avg: "$reviews.rating" }
                            }
                        }
                    ],
                    { updatePipeline: true }
                );
            } else {
                await Product.updateOne(
                    { _id: product._id },
                    [
                        {
                            $set: {
                                reviews: {
                                    $concatArrays: [
                                        { $ifNull: ["$reviews", []] },
                                        [{ user, name: "Test User", rating: Number(rating), comment: "test" }]
                                    ]
                                }
                            }
                        },
                        {
                            $set: {
                                numOfReviews: { $size: "$reviews" },
                                ratings: { $avg: "$reviews.rating" }
                            }
                        }
                    ],
                    { updatePipeline: true }
                );
            }
        };

        const startTime = Date.now();
        // Fire 50 concurrent reviews
        await Promise.all(users.map((u, i) => addReview(u, i % 5 + 1))); // Ratings 1-5
        const duration = Date.now() - startTime;

        const updatedProduct = await Product.findById(product._id);

        console.log(`Duration: ${duration}ms`);
        console.log(`Expected numOfReviews: 50, Actual: ${updatedProduct.numOfReviews}`);

        const sumOfRatings = Array.from({ length: 50 }).map((_, i) => i % 5 + 1).reduce((a, b) => a + b, 0);
        const expectedRating = sumOfRatings / 50;
        console.log(`Expected rating: ${expectedRating}, Actual: ${updatedProduct.ratings}`);

    }, 10000);
});
