const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDatabase = require("./config/database");
const Product = require("./models/productModel");

// Config
dotenv.config({ path: "backend/config/config.env" });

// Connect to Database
// Connect to Database
const connectDB = async () => {
    try {
        const data = await mongoose.connect(process.env.DB_URI);
        console.log(`Mongodb connected with server: ${data.connection.host}`);
    } catch (error) {
        console.log(error);
    }
};

const updateStock = async () => {
    try {
        await connectDB();
        const result = await Product.updateMany({}, { stock: 50 });
        console.log("Stock updated successfully", result);
        process.exit();
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

updateStock();
