require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { clerkMiddleware } = require("@clerk/express");
const clerkWebhooks = require("./controllers/clerkWebhooks");

// connect to db
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware()); // Clerk middleware

// Api to receive clerk webhooks
app.post("/api/clerk", clerkWebhooks);

// Routes
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
