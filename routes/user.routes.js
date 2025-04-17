import express from "express";
import {
  registerUser,
  verifyUser,
  loginUser,
  userProfile,
  logoutUser,
} from "../controllers/user.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:verificationToken", verifyUser);
router.post("/login", loginUser);
router.get("/profile", isLoggedIn, userProfile);
router.get("/logout", isLoggedIn, logoutUser);

export default router;
