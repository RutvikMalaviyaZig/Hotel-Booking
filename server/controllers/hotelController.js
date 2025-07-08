const Hotel = require("../models/Hotel");
const User = require("../models/User");

const registerHotel = async (req, res) => {
    try {
        const { name, address, contact, city } = req.body;
        const owner = req.user._id;

        // check if user already exists
        const user = await Hotel.findOne({ owner });
        if (user) {
            return res.status(404).json({ success: false, message: "Hotel already exists" });
        }
        const hotel = await Hotel.create({ name, address, contact, city, owner });
        await User.findByIdAndUpdate(owner, { role: "owner" });
        res.status(201).json({ success: true, hotel, message: "Hotel registered successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

module.exports = {
    registerHotel
}