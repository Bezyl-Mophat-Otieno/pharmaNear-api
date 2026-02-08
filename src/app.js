const express = require("express");
const cors = require("cors");
require("dotenv").config();
const errorHandler = require("./middleware/error-handler");

const userRoutes = require("./routes/user-routes");
const authRoutes = require("./routes/auth-routes")
const productRoutes = require("./routes/product-routes");
const categoryRoutes = require("./routes/category-routes");
const subcategoryRoutes = require("./routes/sub-category-routes");
const orderRoutes = require("./routes/order-routes");
const stockRoutes = require("./routes/stock-routes");
const uploadRoutes = require("./routes/upload-routes");
const transactionRoutes = require("./routes/transaction-routes");
const cookieParser = require("cookie-parser");
const app = express();

const allowedOrigins = [
    process.env.BEEQ_FRONTEND_URL1,
    process.env.BEEQ_FRONTEND_URL2, 
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173'
];

const validOrigins = allowedOrigins.filter(origin => origin);

console.log('Allowed CORS origins:', validOrigins);
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (validOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie']
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(errorHandler)
app.get("/", (_,res)=>res.send('Welcome to Shamsy Api'))
app.use("/api", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/uploads",  uploadRoutes )
app.use("/api/transactions", transactionRoutes);



app.use(errorHandler);
module.exports = app;
