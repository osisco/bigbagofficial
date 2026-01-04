import express from "express";
import { purchaseRollPackage } from "../controllers/rollPackage.js";
import { isVendor } from "../middleware/auth.js"; // JWT middleware

const router = express.Router();

// POST /api/roll-packages/purchase
router.post("/purchase", isVendor, purchaseRollPackage);

export default router;
