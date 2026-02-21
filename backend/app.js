const express = require('express');
const compression = require('compression');
const app = express();

// Enable trust proxy for rate limiting behind load balancers
app.set('trust proxy', 1);

const cookieParser = require("cookie-parser");
const errorMidddleware = require('./middleware/error');
const path = require("path")

// Enable compression
app.use(compression());

// Security Headers
app.disable('x-powered-by');
const securityHeaders = require('./middleware/securityHeaders');
app.use(securityHeaders);

// config

// Enable extended query parser for bracket notation (e.g., ratings[gte]=1 -> {ratings: {gte: 1}})
app.set('query parser', 'extended');

// parsing object to json
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser())
app.use(express.urlencoded({
  limit: "1mb",
  extended: true
}))

const cors = require('cors');
const mongoSanitize = require('./middleware/mongoSanitize');

const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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