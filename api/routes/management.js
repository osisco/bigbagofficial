import express from "express";
import { 
  sendShopRequest, 
  takeAction, 
  getShopRequests,
  approveShopRequest,
  rejectShopRequest 
} from "../controllers/management.js";
import { verifyToken, isAdmin, isVendor } from "../middleware/auth.js";
import upload from "../middleware/multer.js";
const router = express.Router();

// Shop request routes
router.get("/shop-requests", verifyToken, isAdmin, getShopRequests);
router.post("/shop-requests/:id/approve", verifyToken, isAdmin, approveShopRequest);
router.post("/shop-requests/:id/reject", verifyToken, isAdmin, rejectShopRequest);

// Legacy routes (keep for backward compatibility)
router.post(
  "/sendShopRequest",
  verifyToken,
  isVendor,
  upload.single("logo"),
  sendShopRequest
);
router.post("/takeAction", verifyToken, isAdmin, takeAction);

export default router;
