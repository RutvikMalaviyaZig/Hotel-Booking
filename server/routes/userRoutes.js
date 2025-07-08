const express = require("express");
const router = express.Router();
const { getUserData, storeRecentSearchedCities } = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getUserData);
router.post("/store-recent-search", authMiddleware, storeRecentSearchedCities);

module.exports = router;