const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    hotel: {
        type: String,
        required: true,
        ref: "Hotel"
    },
    roomType: {
        type: String,
        required: true
    },
    pricePerNight: {
        type: Number,
        required: true
    },
    images: [{
        type: String,
    }],
    amenities: {
        type: Array,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
