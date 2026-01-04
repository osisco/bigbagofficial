import express from "express";
import { getActiveAds, getAllAds, createAd, updateAd, deleteAd } from "../controllers/ad.js";
import upload from "../middleware/multer.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/active", getActiveAds);

// Admin only routes
router.get("/", verifyToken, isAdmin, getAllAds);
router.post("/", verifyToken, isAdmin, upload.single("image"), createAd);
router.put("/:id", verifyToken, isAdmin, upload.single("image"), updateAd);
router.delete("/:id", verifyToken, isAdmin, deleteAd);

export default router;