import { Admin } from "../models/index.js";
import { jwt } from "../config/constant.js";

export const protect = async (req, res, next) => {
    try {
        // get token from header
        const token = req.headers.authorization.split(" ")[1];
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // get user id from token
        req.auth.userId = decoded.userId;
        // check if user exists
        if (!req.auth.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        } else {
            // get user from database
            const admin = await Admin.findById(req.auth.userId);
            // check if user exists
            if (!admin) {
                return res.status(401).json({ success: false, message: "Unauthorized" })
            }
            // set user to req.user
            req.user = admin;
            // call next middleware
            next();
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}