import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { signInAdmin, signUpAdmin, signOutAdmin, refreshToken } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.post("/sign-up", signUpAdmin);
adminRouter.post("/sign-in", signInAdmin);
adminRouter.post("/sign-out", protect, signOutAdmin);
adminRouter.post("/refresh-token", refreshToken);

export default adminRouter;
