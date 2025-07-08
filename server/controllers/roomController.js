const Room = require("../models/Room");
const Hotel = require("../models/Hotel");
const { v2: cloudinary } = require("cloudinary");
// create room
const createRoom = async (req, res) => {
    try {
        const { roomType, pricePerNight, amenities } = req.body;
        const hotel = await Hotel.findOne({ owner: req.auth.userId });
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        const uploadImages = req.files.map(async (file) => {
            const image = await cloudinary.uploader.upload(file.path);
            return image.secure_url;
        });
        const images = await Promise.all(uploadImages);
        const room = await Room.create({ hotel: hotel._id, roomType, pricePerNight: Number(pricePerNight), images, amenities: JSON.parse(amenities) });
        res.status(201).json({ success: true, room, message: "Room created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// get all rooms
const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ isAvailable: true }).populate({
            path: "hotel",
            populate: {
                path: "owner",
                select: "image"
            }
        }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// get all rooms by hotel
const getOwnerRooms = async (req, res) => {
    try {
        const hotelData = await Hotel.findOne({ owner: req.auth.userId });
        if (!hotelData) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        const rooms = await Room.find({ hotel: hotelData._id.toString() }).populate("hotel");
        res.status(200).json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// toggle room availability
const toggleRoomAvailability = async (req, res) => {
    try {
        const { roomId } = req.body;
        const roomData = await Room.findById(roomId);
        if (!roomData) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }
        roomData.isAvailable = !roomData.isAvailable;
        await roomData.save();
        res.status(200).json({ success: true, roomData });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = {
    createRoom,
    getAllRooms,
    getOwnerRooms,
    toggleRoomAvailability
}