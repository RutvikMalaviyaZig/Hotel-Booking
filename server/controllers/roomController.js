import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import { v2 as cloudinary } from "cloudinary";

export const createRoom = async (req, res) => {
    try {
        const { roomType, pricePerNight, amenities } = req.body;
        const hotel = await Hotel.findOne({ owner: req.user._id });
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        const uploadImages = req.files.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path)
            return result.secure_url;
        });
        const images = await Promise.all(uploadImages);
        const room = await Room.create({ hotel: hotel._id, roomType, pricePerNight: Number(pricePerNight), amenities: JSON.parse(amenities), images });
        res.status(201).json({ success: true, message: "Room created successfully", room });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

export const getRooms = async (req, res) => {
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
        res.status(500).json({ message: error.message });
    }
}

export const getOwnerRooms = async (req, res) => {
    try {
        const hotelData = await Hotel.findOne({ owner: req.user._id });
        const rooms = await Room.find({ hotel: hotelData._id.toString() }).populate("hotel");
        res.status(200).json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const toggleRoomAvailability = async (req, res) => {
    try {
        const { roomId } = req.body;
        const roomData = await Room.findById(roomId);
        roomData.isAvailable = !roomData.isAvailable;
        await roomData.save();
        res.status(200).json({ success: true, message: "Room availability toggled successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}