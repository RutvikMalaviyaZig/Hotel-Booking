import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import userRouter from "./routes/userRoutes.js";
import hotelRoute from "./routes/hotelRoute.js";
import connectCloudinary from "./config/cloudinary.js";
import roomRoute from "./routes/roomRoute.js";
import bookingRoute from "./routes/bookingRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";

connectDB();
connectCloudinary();

const app = express();

// Stripe webhook needs the raw body, so we need to handle it before any other middleware
app.post(
    "/api/stripe",
    // Raw body parser for Stripe webhook
    express.raw({ type: 'application/json' }),
    // Stripe webhook handler
    stripeWebhooks
);

// Regular middleware for all other routes
const allowedOrigins = [
    "http://localhost:5173",
    "https://hotel-booking-jade-chi.vercel.app",
];

// Handle preflight requests
app.options('*', cors({
    origin: allowedOrigins,
    credentials: true
}));

// Then apply CORS to all other routes
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Regular body parser for all other routes
app.use(express.json());

// Parse JSON bodies (must come after the webhook route)
app.use(express.json());
app.use(clerkMiddleware());

// Define API routes
app.use("/api/clerk", clerkWebhooks);
app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/bookings", bookingRoute);

app.get("/", (req, res) => {
    res.send({ success: true, message: "Server is running" });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
