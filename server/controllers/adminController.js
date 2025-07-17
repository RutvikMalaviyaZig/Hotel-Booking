import { Admin, Hotel, Booking, User, Room } from "../models/index.js";
import { bcrypt, jwt, mongoose, USER_ROLES, TOKEN_EXPIRY, VALIDATION_EVENTS, HTTP_STATUS_CODE } from "../config/constant.js";
import { validateAdmin } from "../helpers/validation/AdminValidation.js";
import { validateHotel } from "../helpers/validation/HotelValidation.js";
import { validateUser } from "../helpers/validation/UserValidation.js";

// sign up admin
export const signUpAdmin = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, email, password } = req.body;
        const validateAdminData = validateAdmin({ name, email, password, eventCode: VALIDATION_EVENTS.CREATE_ADMIN });
        if (validateAdminData.hasError) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateAdminData.errors });
        }
        const user = await Admin.findOne({ email });
        if (user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.AdminAlreadyExists') });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = new mongoose.Types.ObjectId();
        const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.ADMIN_ACCESS_TOKEN });
        const refreshToken = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.ADMIN_REFRESH_TOKEN });
        await Admin.create([{ _id: userId, username: name, email, password: hashedPassword, role: USER_ROLES.ADMIN, accessToken: token, refreshToken }], { session });
        await session.commitTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Admin.SignUpSuccess'), token });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// sign in admin
export const signInAdmin = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { email, password } = req.body;
        const validateAdminData = validateAdmin({ email, password, eventCode: VALIDATION_EVENTS.SIGN_IN_ADMIN });
        if (validateAdminData.hasError) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateAdminData.errors });
        }
        const user = await Admin.findOne({ email });
        if (!user) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.AdminNotFound') });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.InvalidPassword') });
        }
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.ADMIN_ACCESS_TOKEN });
        const refreshToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.ADMIN_REFRESH_TOKEN });
        user.accessToken = token;
        user.refreshToken = refreshToken;
        await user.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Admin.SignInSuccess'), token });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// refresh token
export const refreshToken = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let refreshToken = req.headers['authorization'];
        //check if refreshToken starts with Bearer, fetch the token or return error
        if (refreshToken && refreshToken.startsWith('Bearer ')) {
            //if token start with Bearer
            refreshToken = refreshToken.split(' ')[1];
        } else {
            //if token is not provided then send validation response
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
                status: HTTP_STATUS_CODE.UNAUTHORIZED,
                errorCode: '',
                message: req.__('User.Auth.TokenNotFound'),
                data: {},
                error: '',
            });
        }

        const user = await Admin.findOne({ refreshToken });
        if (!user) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.AdminNotFound') });
        }
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.ADMIN_ACCESS_TOKEN })
        user.accessToken = token;
        await user.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Admin.SignInSuccess'), token });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// sign out admin
export const signOutAdmin = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.auth.userId;
        const validateAdminData = validateAdmin({ userId, eventCode: VALIDATION_EVENTS.SIGN_OUT_ADMIN });
        if (validateAdminData.hasError) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateAdminData.errors });
        }
        const user = await Admin.findById(userId);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.AdminNotFound') });
        }
        user.accessToken = null;
        user.refreshToken = null;
        await user.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Admin.SignOutSuccess') });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// update admin
export const updateAdmin = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, email } = req.body;
        const validateAdminData = validateAdmin({ name, email, eventCode: VALIDATION_EVENTS.UPDATE_ADMIN });
        if (validateAdminData.hasError) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateAdminData.errors });
        }
        const user = await Admin.findById(req.auth.userId);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.AdminNotFound') });
        }
        user.name = name;
        user.email = email;
        await user.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Admin.UpdateSuccess') });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: USER_ROLES.USER });
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, users });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// get all admins
export const getAllHotelOwners = async (req, res) => {
    try {
        const hotelOwners = await User.find({ role: USER_ROLES.HOTEL_OWNER });
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, hotelOwners });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// get all hotels
export const getAllHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find();
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, hotels });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// get all rooms
export const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find();
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, rooms });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// get all bookings
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find();
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, bookings });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// get booking of particular hotel owner
export const getHotelBookings = async (req, res) => {
    try {
        const validateHotelData = validateHotel({ hotelId: req.params.id, eventCode: VALIDATION_EVENTS.GET_HOTEL_BOOKINGS });
        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }
        const hotel = await Hotel.findOne({ owner: req.params.id });
        if (!hotel) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }
        const bookings = await Booking.find({ hotel: hotel._id }).populate("room hotel user").sort({ createdAt: -1 });
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, bookings, totalBookings, totalRevenue });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

// get booking of particular user
export const getUserBookings = async (req, res) => {
    try {
        const validateUserData = validateUser({ userId: req.params.id, eventCode: VALIDATION_EVENTS.GET_USER_BOOKINGS });
        if (validateUserData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateUserData.errors });
        }
        const user = await User.findOne({ _id: req.params.id });
        if (!user) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('User.UserNotFound') });
        }
        const bookings = await Booking.find({ user: user._id }).populate("room hotel").sort({ createdAt: -1 });
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, bookings, totalBookings, totalRevenue });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}
