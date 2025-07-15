import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

// sign up admin
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
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// sign in admin
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

// sign out admin
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

// update admin
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

// get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "user" });
        res.json({ success: true, users });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// get all admins
export const getAllHotelOwners = async (req, res) => {
    try {
        const hotelOwners = await User.find({ role: "hotelOwner" });
        res.json({ success: true, hotelOwners });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// get all hotels
export const getAllHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find();
        res.json({ success: true, hotels });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// get all rooms
export const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json({ success: true, rooms });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// get all bookings
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json({ success: true, bookings });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// get booking of particular hotel owner
export const getHotelBookings = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ owner: req.params.id });
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        const bookings = await Booking.find({ hotel: hotel._id }).populate("room hotel user").sort({ createdAt: -1 });
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        res.status(200).json({ success: true, bookings, totalBookings, totalRevenue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// get booking of particular user
export const getUserBookings = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const bookings = await Booking.find({ user: user._id }).populate("room hotel").sort({ createdAt: -1 });
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        res.status(200).json({ success: true, bookings, totalBookings, totalRevenue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
