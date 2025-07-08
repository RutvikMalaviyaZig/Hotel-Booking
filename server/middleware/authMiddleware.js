const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        const user = req.auth();

        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        } else {
            const userData = await User.findById(user.userId);
            if (!userData) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            req.user = userData;
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


module.exports = {
    authMiddleware
}