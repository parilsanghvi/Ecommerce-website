// import app
const app = require("./app")
const cloudinary = require("cloudinary")
const connectDatabase = require('./config/database')
// handeling uncaught exception
process.on("uncaughtException", (err) => {
    console.log(`error: ${err.message}`);
    console.log("shutting down server due to uncaughtException");
    server.close(() => {
        process.exit(1);
    })
})
// config


//  connect database
connectDatabase()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// takes routes from app and listens on port
const server = app.listen(process.env.PORT, () => {
    console.log(`server is working on http://localhost:${process.env.PORT}`);
})
// unhandeled promise rejection
process.on("unhandledRejection", err => {
    console.log(`error: ${err.message}`);
    console.log("shutting down server due to unhandeled promise rejection");
    server.close(() => {
        process.exit(1);
    })
})