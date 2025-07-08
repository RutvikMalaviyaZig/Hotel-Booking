require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { clerkMiddleware } = require("@clerk/express");
const clerkWebhooks = require("./controllers/clerkWebhooks");
const userRoutes = require("./routes/userRoutes");
const hotelRoutes = require("./routes/hotelroutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const connectCloudinary = require("./config/cloudinary");
const { stripeWebhooks } = require("./controllers/stripeWebhooks");

// connect to db
connectDB();
connectCloudinary();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware()); // Clerk middleware

// Api to receive stripe webhooks
app.post("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// Api to receive clerk webhooks
app.use("/api/clerk", clerkWebhooks);

// Routes
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// User Routes
app.use("/api/user", userRoutes);

// Hotel Routes
app.use("/api/hotel", hotelRoutes);

// Room Routes
app.use("/api/room", roomRoutes);

// Booking Routes
app.use("/api/booking", bookingRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
