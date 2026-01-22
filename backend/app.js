const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const errorMidddleware = require('./middleware/error');
const path = require("path")
// config

// parsing object to json
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser())
app.use(express.urlencoded({
  limit: "50mb",
  extended: true
}))

const cors = require('cors');
const mongoSanitize = require('./middleware/mongoSanitize');

app.use(cors({
  origin: true,
  credentials: true
}));

// Sanitize data to prevent NoSQL injection
app.use(mongoSanitize);

// import route from productroute
const product = require("./routes/productRoute");
const user = require("./routes/userRoute")
const order = require("./routes/orderRoute")
const payment = require("./routes/paymentRoute")


// it will give route to product crud operations
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);

app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get(/^(.*)$/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});
// middleware for error
app.use(errorMidddleware);


// export app routes to server
module.exports = app