import express from "express";
import { signUp, login, logout, refreshToken } from "../controllers/auth.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
router.post("/login", login);
router.post("/signup", signUp); // Changed from signUp to signup
router.post("/logout", verifyToken, logout);
router.post("/refresh", refreshToken);

export default router;
