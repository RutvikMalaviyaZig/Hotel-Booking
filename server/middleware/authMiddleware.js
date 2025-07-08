const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    } else {
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      req.user = user;
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  authMiddleware,
};
