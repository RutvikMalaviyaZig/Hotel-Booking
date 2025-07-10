import stripe from "stripe";
import Booking from "../models/Booking.js";

export const stripeWebhooks = async (req, res) => {
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Time:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);

    // Log headers but redact sensitive information
    const headers = { ...req.headers };
    if (headers['stripe-signature']) {
        headers['stripe-signature'] = '***REDACTED***';
    }
    console.log('Headers:', JSON.stringify(headers, null, 2));

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];

    if (!sig) {
        console.error('❌ No Stripe signature found in headers');
        return res.status(400).json({ error: 'No Stripe signature found', received: false });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('❌ STRIPE_WEBHOOK_SECRET is not set');
        return res.status(500).json({ error: 'Server configuration error', received: false });
    }

    // Log first 200 chars of body for debugging
    const bodyString = req.body.toString();
    console.log('Body preview:', bodyString.substring(0, 200));

    let event;
    try {
        console.log('Verifying webhook signature...');
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log(`✅ Verified webhook: ${event.type} (${event.id})`);
    } catch (error) {
        console.error('❌ Webhook signature verification failed:', error.message);
        console.error('Expected webhook secret:', process.env.STRIPE_WEBHOOK_SECRET ? '***SET***' : 'NOT SET');
        return res.status(400).json({
            error: 'Webhook signature verification failed',
            message: error.message,
            received: false
        });
    }
    console.log(event);
    try {
        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;
            console.log('Processing payment_intent.succeeded for:', paymentIntentId);

            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
                limit: 1
            });

            if (!session.data || session.data.length === 0) {
                console.error('No checkout session found for payment intent:', paymentIntentId);
                return res.status(400).send('No checkout session found');
            }

            const { bookingId } = session.data[0].metadata;
            if (!bookingId) {
                console.error('No bookingId in session metadata');
                return res.status(400).send('No bookingId in session metadata');
            }

            console.log('Updating booking:', bookingId);
            const bookingData = await Booking.findByIdAndUpdate(
                bookingId,
                { isPaid: true, paymentMethod: "stripe" },
                { new: true }
            );

            if (!bookingData) {
                console.error('Booking not found:', bookingId);
                return res.status(404).send('Booking not found');
            }

            console.log('Booking updated successfully:', bookingId);
        } else {
            console.log('Unhandled event type:', event.type);
            // Return success for unhandled event types to prevent retries
            return res.status(200).json({ received: true });
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send(`Webhook Error: ${error.message}`);
    }
}

