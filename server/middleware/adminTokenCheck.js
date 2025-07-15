import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth.userId = decoded.userId;
    if (!req.auth.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" })
    } else {
        const admin = await Admin.findById(req.auth.userId);
        req.user = admin;
        next();
    }
}