import express from "express";
import { 
  createOffer, 
  getOffers, 
  getOfferById, 
  getOffersByShop, 
  updateOffer, 
  deleteOffer 
} from "../controllers/offer.js";
import upload from "../middleware/multer.js";
import { verifyToken, isVendorOrAdmin } from "../middleware/auth.js";
const router = express.Router();

// Public routes
router.get("/", getOffers);
router.get("/:id", getOfferById);
router.get("/shop/:shopId", getOffersByShop);

// Vendor/Admin routes
router.post("/", verifyToken, isVendorOrAdmin, upload.single("image"), createOffer);
router.put("/:id", verifyToken, isVendorOrAdmin, upload.single("image"), updateOffer);
router.delete("/:id", verifyToken, isVendorOrAdmin, deleteOffer);

export default router;
