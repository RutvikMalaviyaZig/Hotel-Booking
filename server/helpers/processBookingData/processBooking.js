import Booking from "../../models/Booking.js";

export const processBooking = async (data) => {
    try {
        // Extract common fields
        const { _id, user, room, hotel, checkInDate, checkOutDate, totalPrice, guests, action } = data;

        if (action === 'delete') {
            // Delete booking
            if (!_id) {
                throw new Error('Booking ID is required for deletion');
            }
            const deleted = await Booking.findByIdAndDelete(_id);
            if (!deleted) {
                throw new Error('Booking not found');
            }
            return deleted;
        }

        // Handle create/update operations
        if (_id && action === 'update') {
            // Update existing booking
            const booking = await Booking.findByIdAndUpdate(
                _id,
                { checkInDate, checkOutDate, guests },
                { new: true }
            );
            return booking;
        } else if (action === 'create') {
            // Create new booking
            const booking = await Booking.create({
                user,
                room,
                hotel,
                checkInDate,
                checkOutDate,
                totalPrice,
                guests
            });
            return booking;
        }
    } catch (error) {
        console.error("Error processing booking:", error);
        throw error;
    }
}
