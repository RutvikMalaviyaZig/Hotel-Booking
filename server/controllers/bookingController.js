import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import transporter from "../config/nodemailer.js";
import stripe from "stripe";
import { sendSQSMessage } from "../helpers/SQS/sendData.js";

const checkAvailability = async ({ room, checkInDate, checkOutDate }) => {
    try {
        const bookings = await Booking.find({
            room,
            checkInDate: { $lte: checkOutDate },
            checkOutDate: { $gte: checkInDate },
        });
        const isAvailable = bookings.length === 0;
        return isAvailable;
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const checkAvailabilityAPI = async (req, res) => {
    try {
        const { room, checkInDate, checkOutDate } = req.body;
        const isAvailable = await checkAvailability({ room, checkInDate, checkOutDate });
        res.status(200).json({ success: true, isAvailable });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const createBooking = async (req, res) => {
    try {
        const { room, checkInDate, checkOutDate, guests } = req.body;
        const user = req.user;

        const isAvailable = await checkAvailability({ room, checkInDate, checkOutDate });

        if (!isAvailable) {
            return res.status(400).json({ success: false, message: "Room is not available" });
        }
        const roomData = await Room.findById(room).populate("hotel");
        let totalPrice = roomData.pricePerNight;

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        totalPrice = totalPrice * diffDays;
        // send booking data to SQS
        const booking = await sendSQSMessage("booking", { _id: null, action: "create", user: user._id, room, hotel: roomData.hotel._id, checkInDate, checkOutDate, totalPrice, guests });
        if (!booking) {
            return res.status(500).json({ success: false, message: "Failed to create booking" });
        }
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: req.user.email,
            subject: "Booking Confirmation",
            text: `Your booking has been confirmed.
            Hotel: ${roomData.hotel.name}
            Room: ${roomData.roomType}
            Check-in Date: ${checkInDate}
            Check-out Date: ${checkOutDate}
            Total Price: ${totalPrice}
            Guests: ${guests}
            Thank you for using our service.`,
        }
        await transporter.sendMail(mailOptions);
        res.status(201).json({ success: true, message: "Booking created successfully", booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// update booking by admin or hotel owner
export const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkInDate, checkOutDate, guests } = req.body;
        const user = req.user;
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (user.role === "admin" || user.role === "hotelOwner") {
            await sendSQSMessage("booking", { _id: id, action: "update", booking: { _id, checkInDate, checkOutDate, guests } });
        } else {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        res.status(200).json({ success: true, message: "Booking updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// delete booking
export const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const user = req.user;
        if (user) {
            await Booking.findByIdAndUpdate(id, {
                isDeleted: true,
                deletedAt: new Date(),
                status: "cancelled"
            });

            await sendSQSMessage("booking", { _id: id, action: "delete", booking: { _id } });
        } else {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            data: { isDeleted: true, deletedAt: new Date() }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const getUserBookings = async (req, res) => {
    try {
        const user = req.user._id;
        const bookings = await Booking.find({ user }).populate("room hotel").sort({ createdAt: -1 });
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const getHotelBookings = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ owner: req.auth.userId });
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        const bookings = await Booking.find({ hotel: hotel._id }).populate("room hotel user").sort({ createdAt: -1 });
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        res.status(200).json({ success: true, bookings, totalBookings, totalRevenue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// create payment intent
export const stripePayment = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
}