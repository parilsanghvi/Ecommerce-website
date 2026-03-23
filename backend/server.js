// import app
const app = require("./app")
const cloudinary = require("cloudinary")
const connectDatabase = require('./config/database')
// handling uncaught exception
process.on("uncaughtException", (err) => {
    console.error(`error: ${err.message}`);
    console.error("shutting down server due to uncaughtException");
    process.exit(1);
})
// config


//  connect database
connectDatabase().then(() => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // takes routes from app and listens on port
    const PORT = process.env.PORT || 4000;
    const server = app.listen(PORT, () => {
        console.log(`server is working on http://localhost:${PORT}`);
    });

    // unhandled promise rejection
    process.on("unhandledRejection", err => {
        console.error(`error: ${err.message}`);
        console.error("shutting down server due to unhandled promise rejection");
        server.close(() => {
            process.exit(1);
        });
    });
}).catch((err) => {
    console.error(`Database connection failed: ${err.message}`);
    process.exit(1);
});
