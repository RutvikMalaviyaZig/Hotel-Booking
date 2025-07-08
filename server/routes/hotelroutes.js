const express = require("express");
const router = express.Router();
const { registerHotel } = require("../controllers/hotelController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, registerHotel);

module.exports = router;