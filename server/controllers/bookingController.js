import { Hotel, Booking, Room } from "../models/index.js";
import { HTTP_STATUS_CODE, EVENT_TYPES, ACTIONS, transporter, mongoose } from "../config/constant.js";
import { sendSQSMessage } from "../helpers/SQS/sendData.js";
import { validateBooking } from "../helpers/validation/BookingValidation.js";

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
    return error;
  }
};

export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const validateBookingData = validateBooking({ eventCode: VALIDATION_EVENTS.CHECK_AVAILABILITY, room, checkInDate, checkOutDate });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    const isAvailable = await checkAvailability({
      room,
      checkInDate,
      checkOutDate,
    });
    return res.status(HTTP_STATUS_CODE.OK).json({ success: true, isAvailable });
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user;
    const validateBookingData = validateBooking({ eventCode: VALIDATION_EVENTS.CREATE_BOOKING, room, checkInDate, checkOutDate, guests });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }

    const isAvailable = await checkAvailability({
      room,
      checkInDate,
      checkOutDate,
    });

    if (!isAvailable) {
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: req.__('Room.RoomNotAvailable') });
    }
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    totalPrice = totalPrice * diffDays;
    // send booking data to SQS
    const booking = await sendSQSMessage(EVENT_TYPES.BOOKING, {
      _id: null,
      action: ACTIONS.CREATE,
      user: user._id,
      room,
      hotel: roomData.hotel._id,
      checkInDate,
      checkOutDate,
      totalPrice,
      guests,
    });
    if (!booking) {
      return res
        .status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: req.__('Booking.CreateFailed') });
    }
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: req.user.email,
      subject: req.__('Booking.CreateSuccess'),
      text: `Your booking has been confirmed.
            Hotel: ${roomData.hotel.name}
            Room: ${roomData.roomType}
            Check-in Date: ${checkInDate}
            Check-out Date: ${checkOutDate}
            Total Price: ${totalPrice}
            Guests: ${guests}
            Thank you for using our service.`,
    };
    await transporter.sendMail(mailOptions);
    res.status(HTTP_STATUS_CODE.CREATED).json({
      success: true,
      message: req.__('Booking.CreateSuccess'),
      booking,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

// update booking by admin or hotel owner
export const updateBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { checkInDate, checkOutDate, guests } = req.body;
    const user = req.user;
    const validateBookingData = validateBooking({ eventCode: VALIDATION_EVENTS.UPDATE_BOOKING, id, checkInDate, checkOutDate, guests });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    const booking = await Booking.findById(id);
    if (!booking) {
      return res
        .status(HTTP_STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: req.__('Booking.BookingNotFound') });
    }
    if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.HOTEL_OWNER) {
      await sendSQSMessage(EVENT_TYPES.BOOKING, {
        _id: id,
        action: ACTIONS.UPDATE,
        booking: { _id, checkInDate, checkOutDate, guests },
      });
    } else {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ success: false, message: req.__('General.Unauthorized') });
    }
    res
      .status(HTTP_STATUS_CODE.OK)
      .json({ success: true, message: req.__('Booking.UpdateSuccess') });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

// delete booking
export const deleteBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const validateBookingData = validateBooking({ eventCode: VALIDATION_EVENTS.DELETE_BOOKING, id });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    const booking = await Booking.findById(id);
    if (!booking) {
      return res
        .status(HTTP_STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: req.__('Booking.BookingNotFound') });
    }
    const user = req.user;
    if (user) {
      await Booking.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
        status: BOOKING_STATUS.CANCELLED,
      });

      await sendSQSMessage(EVENT_TYPES.BOOKING, {
        _id: id,
        action: ACTIONS.DELETE,
        booking: { _id },
      });
    } else {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ success: false, message: req.__('General.Unauthorized') });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: req.__('Booking.BookingCancelled'),
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const validateBookingData = validateBooking({ eventCode: VALIDATION_EVENTS.GET_USER_BOOKINGS, user });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });
    res.status(HTTP_STATUS_CODE.OK).json({ success: true, bookings });
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

export const getHotelBookings = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const validateBookingData = validateBooking({ hotel: req.auth.userId, eventCode: VALIDATION_EVENTS.GET_HOTEL_BOOKINGS });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    const hotel = await Hotel.findOne({ owner: req.auth.userId });
    if (!hotel) {
      return res
        .status(HTTP_STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: req.__('Hotel.HotelNotFound') });
    }
    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + booking.totalPrice,
      0
    );
    res
      .status(HTTP_STATUS_CODE.OK)
      .json({ success: true, bookings, totalBookings, totalRevenue });
  } catch (error) {
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

// not in use
// create payment intent
// export const stripePayment = async (req, res) => {
//   try {
//     const { bookingId } = req.body;
//     const bookingData = await Booking.findById(bookingId);
//     const roomData = await Room.findById(bookingData.room).populate("hotel");
//     const amount = bookingData.totalPrice;
//     const { origin } = req.headers;
//     const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
//     const line_items = [
//       {
//         price_data: {
//           currency: CURRENCY.USD,
//           product_data: {
//             name: roomData.hotel.name,
//           },
//           unit_amount: amount * 100,
//         },
//         quantity: 1,
//       },
//     ];

//     const session = await stripeInstance.checkout.sessions.create({
//       line_items,
//       mode: EVENT_TYPES.PAYMENT,
//       success_url: `${origin}/loader/my-bookings`,
//       cancel_url: `${origin}/my-bookings`,
//       metadata: { bookingId },
//     });

//     res.status(HTTP_STATUS_CODE.OK).json({ success: true, url: session.url, bookingId });
//   } catch (error) {
//     res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
//   }
// };
