import express from "express";
import {
  createRoll,
  getRolls,
  getRollById,
  getRollsByShop,
  updateRoll,
  deleteRoll,
  likeRoll,
  unlikeRoll,
  shareRoll,
  saveRoll,
  unsaveRoll,
} from "../controllers/roll.js";
import upload from "../middleware/multer.js";
import { verifyToken } from "../middleware/auth.js";
import { checkRollAvailability } from "../middleware/rollConsumption.js";

const router = express.Router();

// Get all rolls
router.get("/", getRolls);

// Get roll by ID
router.get("/:id", getRollById);

// Get rolls for a specific shop
router.get("/shop/:shopId", getRollsByShop);


// Test FormData endpoint without multer
router.post("/test-formdata", verifyToken, (req, res) => {
  console.log('=== FORMDATA TEST ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({ success: true, message: "FormData test received" });
});

// Upload a new roll (video) - with roll consumption validation
router.post("/", verifyToken, upload.single("video"), createRoll);

// Update roll
router.put("/:id", verifyToken, updateRoll);

// Delete roll
router.delete("/:id", verifyToken, deleteRoll);

// Like functionality
router.post("/:id/like", verifyToken, likeRoll);
router.delete("/:id/like", verifyToken, unlikeRoll);

// Share functionality
router.post("/:id/share", verifyToken, shareRoll);

// Save functionality
router.post("/:id/save", verifyToken, saveRoll);
router.delete("/:id/save", verifyToken, unsaveRoll);

export default router;
