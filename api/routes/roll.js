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
import { validatePagination, validateCursor, validateRollInput } from "../middleware/validation.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Get all rolls
router.get("/", validatePagination, validateCursor, getRolls);

// Get roll by ID
router.get("/:id", getRollById);

// Get rolls for a specific shop
router.get("/shop/:shopId", getRollsByShop);

// Upload a new roll (video) - with roll consumption validation
router.post("/", verifyToken, upload.single("video"), validateRollInput, createRoll);

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
