import express from "express";
import {
  getShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  getShopReviews,
  submitShopReview,
  adminCreateShop,
} from "../controllers/shop.js";
import upload from "../middleware/multer.js";
import { verifyToken, isAdmin, isVendor } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getShops);
router.get("/:id", getShopById);
router.get("/:id/reviews", getShopReviews);

// Authenticated routes
router.post("/:id/reviews", verifyToken, submitShopReview);

// Admin routes
router.post("/admin/create", verifyToken, isAdmin, upload.single("logo"), adminCreateShop);

// Vendor/Admin routes
router.post("/", verifyToken, isVendor, upload.single("logo"), createShop);
router.put("/:id", verifyToken, upload.single("logo"), updateShop);
router.delete("/:id", verifyToken, isAdmin, deleteShop);

export default router;