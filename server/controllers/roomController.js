import { Hotel, Room } from "../models/index.js";
import { cloudinary, HTTP_STATUS_CODE, VALIDATION_EVENTS, mongoose } from "../config/constant.js";
import { validateRoom } from "../helpers/validation/RoomValidation.js";

export const createRoom = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { roomType, pricePerNight, amenities } = req.body;
        const validateRoomData = validateRoom({ eventCode: VALIDATION_EVENTS.CREATE_ROOM, roomType, pricePerNight, amenities });
        if (validateRoomData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateRoomData.errors });
        }
        const hotel = await Hotel.findOne({ owner: req.user._id });
        if (!hotel) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }

        const uploadImages = req.files.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path)
            return result.secure_url;
        });
        const images = await Promise.all(uploadImages);
        const room = await Room.create([{ hotel: hotel._id, roomType, pricePerNight: Number(pricePerNight), amenities: JSON.parse(amenities), images }], { session });
        await session.commitTransaction();
        session.endSession();
        res.status(HTTP_STATUS_CODE.CREATED).json({ success: true, message: req.__('Room.CreateSuccess'), room });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log(error);
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
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
        res.status(HTTP_STATUS_CODE.OK).json({ success: true, rooms });
    } catch (error) {
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

export const getOwnerRooms = async (req, res) => {
    try {
        const validateRoomData = validateRoom({ eventCode: VALIDATION_EVENTS.GET_OWNER_ROOMS, id: req.user._id });
        if (validateRoomData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateRoomData.errors });
        }
        const hotelData = await Hotel.findOne({ owner: req.user._id });
        const rooms = await Room.find({ hotel: hotelData._id.toString() }).populate("hotel");
        res.status(HTTP_STATUS_CODE.OK).json({ success: true, rooms });
    } catch (error) {
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

export const toggleRoomAvailability = async (req, res) => {
    try {
        const { roomId } = req.body;
        const validateRoomData = validateRoom({ eventCode: VALIDATION_EVENTS.TOGGLE_ROOM_AVAILABILITY, roomId });
        if (validateRoomData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateRoomData.errors });
        }
        const roomData = await Room.findById(roomId);
        roomData.isAvailable = !roomData.isAvailable;
        await roomData.save({ session });
        await session.commitTransaction();
        session.endSession();
        res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Room.UpdateSuccess') });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}