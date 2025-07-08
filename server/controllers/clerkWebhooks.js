const User = require("../models/User");
const { Webhook } = require("svix");

const clerkWebhooks = async (req, res) => {
    try {
        // Initialize svix webhook
        const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        // getting headers
        const headers = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        }

        // verify webhook
        const payload = await webhook.verify(JSON.stringify(req.body), headers);

        // get data from body
        const { data, type } = payload.body;

        // switch case for different events
        switch (type) {
            case "user.created": {
                const userData = {
                    username: data.first_name + " " + data.last_name,
                    email: data.email_addresses[0].email_address,
                    image: data.image_url,
                }
                await User.create(userData);
                break;
            }
            case "user.updated": {
                const userData = {
                    username: data.first_name + " " + data.last_name,
                    email: data.email_addresses[0].email_address,
                    image: data.image_url,
                }
                await User.findOneAndUpdate({ _id: data.id }, userData);
                break;
            }
            case "user.deleted": {
                await User.findOneAndDelete({ _id: data.id });
                break;
            }
            default: {
                break;
            }
        }
        res.status(200).json({ message: "Webhook received" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = clerkWebhooks;
