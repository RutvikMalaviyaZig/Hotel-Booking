import { stripe, HTTP_STATUS_CODE, BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, PAYMENT_EVENTS } from "../config/constant.js";
import { Booking } from "../models/index.js";

export const stripeWebhooks = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (!sig) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ error: req.__('Stripe.WebhookSignatureVerificationFailed'), received: false });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: req.__('Stripe.ServerConfigurationError'), received: false });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
            error: req.__('Stripe.WebhookSignatureVerificationFailed'),
            message: error.message,
            received: false
        });
    }

    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata?.bookingId;

    if (!bookingId) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ error: req.__('Stripe.NoBookingIdInMetadata') });
    }

    try {
        switch (event.type) {
            case PAYMENT_EVENTS.PAYMENT_INTENT_SUCCEEDED: {
                const updatedBooking = await Booking.findByIdAndUpdate(
                    bookingId,
                    {
                        status: BOOKING_STATUS.COMPLETED,
                        paymentStatus: PAYMENT_STATUS.PAID,
                        paymentId: paymentIntent.id,
                        paymentDate: new Date(),
                        isPaid: true,
                        paymentMethod: PAYMENT_METHOD.STRIPE
                    },
                    { new: true }
                );

                if (!updatedBooking) {
                    return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({ error: req.__('Booking.BookingNotFound') });
                }
                break;
            }
            case PAYMENT_EVENTS.PAYMENT_INTENT_PAYMENT_FAILED: {
                await Booking.findByIdAndUpdate(
                    bookingId,
                    {
                        status: BOOKING_STATUS.PAYMENT_FAILED,
                        paymentStatus: PAYMENT_STATUS.FAILED,
                        paymentError: paymentIntent.last_payment_error?.message,
                        isPaid: false
                    }
                );
                break;
            }
            case PAYMENT_EVENTS.PAYMENT_INTENT_CANCELED: {
                await Booking.findByIdAndUpdate(
                    bookingId,
                    {
                        status: BOOKING_STATUS.CANCELLED,
                        paymentStatus: PAYMENT_STATUS.CANCELLED,
                        isPaid: false
                    }
                );
                break;
            }
            default:
                return res.json({ received: true });
        }
        return res.json({ received: true });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            error: req.__('Booking.UpdateFailed'),
            message: error.message
        });
    }
};
