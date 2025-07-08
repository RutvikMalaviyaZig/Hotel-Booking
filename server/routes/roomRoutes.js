const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { createRoom, getAllRooms, getOwnerRooms, toggleRoomAvailability } = require("../controllers/roomController");


// create room
router.post("/", authMiddleware, upload.array("images", 4), createRoom);
// get all rooms
router.get("/", getAllRooms);
// get all rooms by hotel
router.get("/owner", authMiddleware, getOwnerRooms);
// toggle room availability
router.post("/toggle-availability", authMiddleware, toggleRoomAvailability);


module.exports = router;
