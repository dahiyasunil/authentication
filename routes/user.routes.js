import express from "express";
import {
  registerUser,
  verifyUser,
  loginUser,
} from "../controllers/user.controllers.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:verificationToken", verifyUser);
router.post("/login", loginUser);

export default router;
