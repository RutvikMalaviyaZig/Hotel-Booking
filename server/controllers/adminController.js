import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";

// sign up user
export const signUpAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await Admin.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = new mongoose.Types.ObjectId();
        const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const refreshToken = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        await Admin.create({ _id: userId, username: name, email, password: hashedPassword, role: "user", accessToken: token, refreshToken });
        res.json({ success: true, message: "User signed up successfully", token, refreshToken });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// sign in user
export const signInAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Admin.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid password" });
        }
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const refreshToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        user.accessToken = token;
        user.refreshToken = refreshToken;
        await user.save();
        res.json({ success: true, message: "User signed in successfully", token, refreshToken });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// refresh token
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: "Refresh token is required" });
        }
        const user = await Admin.findOne({ refreshToken });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" })
        user.accessToken = token;
        await user.save();
        res.json({ success: true, message: "User signed in successfully", token });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// sign out user
export const signOutAdmin = async (req, res) => {
    try {
        const user = await Admin.findById(req.auth.userId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        user.accessToken = null;
        user.refreshToken = null;
        await user.save();
        res.json({ success: true, message: "User signed out successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// update user
export const updateAdmin = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await Admin.findById(req.auth.userId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        user.name = name;
        user.email = email;
        await user.save();
        res.json({ success: true, message: "User updated successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}