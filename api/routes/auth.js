import express from "express";
import { signUp, login, logout, refreshToken, sendVerificationCode } from "../controllers/auth.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
router.post("/send-code", sendVerificationCode);
router.post("/login", login);
router.post("/signup", signUp);
router.post("/logout", verifyToken, logout);
router.post("/refresh", refreshToken);

export default router;
