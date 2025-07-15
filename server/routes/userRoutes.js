import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUserData, signInUser, signUpUser, storeRecentSearchedCities, signOutUser, refreshToken } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", protect, getUserData);
userRouter.post("/store-recent-search", protect, storeRecentSearchedCities);
userRouter.post("/sign-up", signUpUser);
userRouter.post("/sign-in", signInUser);
userRouter.post("/sign-out", protect, signOutUser);
userRouter.post("/refresh-token", refreshToken);

export default userRouter;
