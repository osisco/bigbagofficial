import express from "express";
import { toggleFavorite, getFavorites } from "../controllers/favorite.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/toggleFavorites", verifyToken, toggleFavorite);
router.get("/getFavorites", verifyToken, getFavorites);

export default router;
