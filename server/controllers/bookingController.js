
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const transporter = require("../config/nodemailer");
const stripe = require("stripe")
// check availability of room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
    try {
        const bookings = await Booking.find({ room, checkInDate: { $lte: checkOutDate }, checkOutDate: { $gte: checkInDate } });
        const isAvailable = bookings.length === 0;

        return isAvailable;
    } catch (error) {
        return false;
    }
}

// api to check availability of room
const checkAvailabilityApi = async (req, res) => {
    try {
        const { checkInDate, checkOutDate, room } = req.body;
        const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
        res.status(200).json({ success: true, isAvailable });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// create booking api
const createBooking = async (req, res) => {
    try {
        const { checkInDate, checkOutDate, room, guests } = req.body;
        const user = req.user._id;
        // check availability of room
        const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
        if (!isAvailable) {
            return res.status(404).json({ success: false, message: "Room is not available" });
        }
        // calculate total price
        const roomData = await Room.findById(room).populate("hotel");
        let totalPrice = roomData.pricePerNight;
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const diffTime = checkOut.getTime() - checkIn.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalPrice *= diffDays;

        const booking = await Booking.create({
            user,
            room,
            hotel: roomData.hotel._id,
            checkInDate,
            checkOutDate,
            guests: Number(guests),
            totalPrice
        });

        // send email to user
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: req.user.email,
            subject: "Booking Confirmation",
            text: `Hello ${req.user.username},
            Your booking is confirmed.
            Booking ID: ${booking._id}
            Check In Date: ${checkInDate}
            Check Out Date: ${checkOutDate}
            Guests: ${guests}
            Total Price: ${totalPrice}`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });

        res.status(201).json({ success: true, booking, message: "Booking created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// get user bookings
const getUserBookings = async (req, res) => {
    try {
        const user = req.user._id;
        const bookings = await Booking.find({ user }).populate("room hotel").sort({ createdAt: -1 });
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// get all bookings by hotel
const getHotelBookings = async (req, res) => {
    try {
        const hotelData = await Hotel.findOne({ owner: req.auth.userId });
        if (!hotelData) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        const bookings = await Booking.find({ hotel: hotelData._id }).populate("room hotel user").sort({ createdAt: -1 });
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((total, booking) => total + booking.totalPrice, 0);
        res.status(200).json({ success: true, dashboardData: { bookings, totalBookings, totalRevenue } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// create payment intent
const stripePayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const bookingData = await Booking.findById(bookingId);
        const roomData = await Room.findById(bookingData.room).populate("hotel");
        const amount = bookingData.totalPrice;
        const { origin } = req.headers;
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        const line_items = [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: roomData.hotel.name,
                    },
                    unit_amount: amount * 100,
                },
                quantity: 1,
            }
        ]

        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            metadata: { bookingId },
        });
        res.status(200).json({ success: true, url: session.url });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = {
    checkAvailability,
    checkAvailabilityApi,
    createBooking,
    getUserBookings,
    getHotelBookings,
    stripePayment
}