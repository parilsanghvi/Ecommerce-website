const app = require("./app")
const cloudinary = require("cloudinary")
const connectDatabase = require('./config/database')
process.on("uncaughtException", (err) => {
    console.error(`error: ${err.message}`);
    console.error("shutting down server due to uncaughtException");
    process.exit(1);
})
connectDatabase().then(() => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const server = app.listen(process.env.PORT, () => {
        console.log(`server is working on http://localhost:${process.env.PORT}`);
    });

    process.on("unhandledRejection", err => {
        console.error(`error: ${err.message}`);
        console.error("shutting down server due to unhandled promise rejection");
        server.close(() => {
            process.exit(1);
        });
    });
});
