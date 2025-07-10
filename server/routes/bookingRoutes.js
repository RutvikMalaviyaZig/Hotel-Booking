import express from "express";
import { checkAvailabilityAPI, createBooking, getUserBookings, getHotelBookings, stripePayment } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const bookingRoute = express.Router();

bookingRoute.post("/check-availability", checkAvailabilityAPI);
bookingRoute.post("/book", protect, createBooking);
bookingRoute.get("/user", protect, getUserBookings);
bookingRoute.get("/hotel", protect, getHotelBookings);
bookingRoute.post("/stripe-payment", protect, stripePayment);

export default bookingRoute;