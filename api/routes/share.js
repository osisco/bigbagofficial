import express from "express";
import { recordShare, getShareStats } from "../controllers/share.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Record a share (requires authentication)
router.post("/record", verifyToken, recordShare);

// Get share statistics (requires authentication)
router.get("/stats", verifyToken, getShareStats);

export default router;