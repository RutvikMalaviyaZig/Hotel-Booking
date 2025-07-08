const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        ref: "User"
    },
    room: {
        type: String,
        required: true,
        ref: "Room"
    },
    hotel: {
        type: String,
        required: true,
        ref: "Hotel"
    },
    checkInDate: {
        type: Date,
        required: true
    },
    checkOutDate: {
        type: Date,
        required: true
    },
    guests: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "paid", "cancelled"]
    },
    paymentMethod: {
        type: String,
        required: true,
        default: "Pay At Hotel"
    },
    isPaid: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;