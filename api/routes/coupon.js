import express from "express";
import { 
  createCoupon, 
  getCoupons, 
  getCouponById, 
  updateCoupon, 
  deleteCoupon 
} from "../controllers/coupon.js";
import upload from "../middleware/multer.js";
import { verifyToken, isVendorOrAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getCoupons);
router.get("/:id", getCouponById);

// Vendor/Admin routes
router.post("/", verifyToken, isVendorOrAdmin, upload.single("image"), createCoupon);
router.put("/:id", verifyToken, isVendorOrAdmin, updateCoupon);
router.delete("/:id", verifyToken, isVendorOrAdmin, deleteCoupon);

export default router;
