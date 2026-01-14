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
  shareShop,
  getTopSharedShopsOfWeek,
} from "../controllers/shop.js";
import upload from "../middleware/multer.js";
import { verifyToken, isAdmin, isVendor } from "../middleware/auth.js";
import jwt from "jsonwebtoken";

// Optional auth middleware - sets req.user if token is present, but doesn't fail if missing
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // attach user info to request
      } else {
        req.user = null;
      }
    } catch (err) {
      // Token invalid or missing, but continue without user
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

const router = express.Router();

// Public routes
router.get("/", getShops);
router.get("/top-shared", optionalAuth, getTopSharedShopsOfWeek); // Works with or without auth - uses user country if authenticated
router.get("/:id", getShopById);
router.get("/:id/reviews", getShopReviews);
router.post("/:id/share", shareShop);

// Authenticated routes
router.post("/:id/reviews", verifyToken, submitShopReview);

// Admin routes
router.post("/admin/create", verifyToken, isAdmin, upload.single("logo"), adminCreateShop);

// Vendor/Admin routes
router.post("/", verifyToken, isVendor, upload.single("logo"), createShop);
router.put("/:id", verifyToken, upload.single("logo"), updateShop);
router.delete("/:id", verifyToken, isAdmin, deleteShop);

export default router;