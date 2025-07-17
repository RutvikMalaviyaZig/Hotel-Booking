import { Hotel, User } from "../models/index.js";
import { USER_ROLES, HTTP_STATUS_CODE, VALIDATION_EVENTS, mongoose } from "../config/constant.js";
import { validateHotel } from "../helpers/validation/HotelValidation.js";

export const registerHotel = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, address, contact, city } = req.body;
        const owner = req.user._id;
        const validateHotelData = validateHotel({ eventCode: VALIDATION_EVENTS.CREATE_HOTEL, id: owner, name, address, contact, city });

        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }

        const hotel = await Hotel.findOne({ name, owner }).session(session);
        if (hotel) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelAlreadyExists') });
        }

        await Hotel.create([{ name, address, contact, owner, city }], { session });
        await User.findByIdAndUpdate(owner, { role: USER_ROLES.HOTEL_OWNER }).session(session);
        await session.commitTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Hotel.CreateSuccess') });
    } catch (error) {
        console.log(error);
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

export const updateHotel = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, address, contact, city, hotelId } = req.body;
        const owner = req.user._id;

        const validateHotelData = validateHotel({ eventCode: VALIDATION_EVENTS.UPDATE_HOTEL, id: owner, name, address, contact, city });

        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }
        const hotel = await Hotel.findOne({ _id: hotelId, owner }).session(session);
        if (!hotel) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }

        await Hotel.findByIdAndUpdate(hotel._id, { name, address, contact, city }).session(session);
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Hotel.UpdateSuccess') });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

export const deleteHotel = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { hotelId } = req.body;
        const owner = req.user._id;

        const validateHotelData = validateHotel({ eventCode: VALIDATION_EVENTS.DELETE_HOTEL, id: owner, hotelId });

        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }

        const hotel = await Hotel.findOne({ owner, _id: hotelId }).session(session);
        if (!hotel) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }

        await Hotel.findByIdAndDelete(hotel._id).session(session);
        await User.findByIdAndUpdate(owner, { role: USER_ROLES.USER }).session(session);
        await session.commitTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Hotel.DeleteSuccess') });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}
