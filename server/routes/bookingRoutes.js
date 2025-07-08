const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { createBooking, getUserBookings, getHotelBookings, checkAvailabilityApi, stripePayment } = require("../controllers/bookingController");

// create booking
router.post("/book", authMiddleware, createBooking);
// get user bookings
router.get("/user", authMiddleware, getUserBookings);
// get hotel bookings
router.get("/hotel", authMiddleware, getHotelBookings);

// check availability of room
router.post("/check-availability", checkAvailabilityApi);
// create payment intent
router.post("/stripe-payment", authMiddleware, stripePayment);


module.exports = router;
