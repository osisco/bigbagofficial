import express from "express";
import { verifyToken, isAdmin, isVendor } from "../middleware/auth.js";
import {
  createVendorProfile,
  addRollPackage,
  spendRoll,
  getVendorProfile,
  getRollPackages,
  purchaseRollPackage,
  createShopRequest,
  getVendorShopRequests,
} from "../controllers/vendorProfile.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// Vendor profile routes
router.get("/profile", verifyToken, isVendor, getVendorProfile);
router.post("/create", verifyToken, isVendor, createVendorProfile);

// Roll package routes
router.get("/roll-packages", verifyToken, isVendor, getRollPackages);
router.post("/roll-packages/purchase", verifyToken, isVendor, purchaseRollPackage);
router.post("/addRollPackage", verifyToken, isAdmin, addRollPackage);
router.post("/spendRoll", verifyToken, isVendor, spendRoll);

// Shop request routes
router.post("/shop-request", verifyToken, isVendor, upload.single("logo"), createShopRequest);
router.get("/shop-requests", verifyToken, isVendor, getVendorShopRequests);

export default router;
