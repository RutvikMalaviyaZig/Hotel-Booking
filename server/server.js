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

// Api to receive stripe webhooks
app.post("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

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
