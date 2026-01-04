import User from "../models/User.js";
import Vendor from "../models/Vendor.js";

console.log("Roll consumption middleware loaded");

export const checkRollAvailability = async (req, res, next) => {
  try {
    console.log("Method:", req.method);
    console.log("Path:", req.path);
    console.log("Original URL:", req.originalUrl);
    console.log("User:", req.user);

    // Only apply to roll creation endpoints
    if (req.method !== "POST" || !req.originalUrl.includes("/rolls")) {
      console.log("Skipping middleware - not a roll POST request");
      return next();
    }

    console.log("Processing roll availability check...");

    // Skip for admin users
    if (req.user?.role === "admin") {
      return next();
    }

    // Check if user is vendor
    if (!req.user || req.user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Only vendors can upload rolls",
      });
    }

    // Get user to check available rolls
    console.log("Looking for user with id:", req.user.id);
    const user = await User.findById(req.user.id);
    console.log("User found in middleware:", user ? "Yes" : "No");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check available rolls from user model
    if ((user.availableRolls || 0) <= 0) {
      return res.status(400).json({
        success: false,
        message: "No available rolls. Share the app daily to earn free rolls!",
        data: {
          availableRolls: 0,
          requiresSharing: true,
        },
      });
    }

    // Get or create vendor profile for tracking
    let vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      console.log("Creating new vendor profile for user:", req.user.id);
      vendor = new Vendor({
        userId: req.user.id,
        availableRolls: 0, // This is now tracked in User model
        totalRollsUsed: 0,
      });
      await vendor.save();
    }

    req.vendor = vendor;
    req.userProfile = user;

    console.log("User has", user.availableRolls, "available rolls");
    next();
  } catch (error) {
    console.error("Roll availability check error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking roll availability",
    });
  }
};

export const handleRollConsumptionError = (error, req, res, next) => {
  console.error("Roll consumption error:", error);

  if (error.name === "RollConsumptionError") {
    return res.status(400).json({
      success: false,
      message: error.message || "Roll consumption failed",
    });
  }

  next(error);
};

export default {
  checkRollAvailability,
  handleRollConsumptionError,
};
