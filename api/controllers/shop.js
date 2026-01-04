import Shop from "../models/Shop.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { feedCache } from "../utils/cache.js";

// Get all shops
export const getShops = async (req, res) => {
  try {
    const { country, category, language, page = 1, limit = 10 } = req.query;

    const cacheKey = `shops:${country || "all"}:${category || "all"}:${language || "all"}:${page}:${limit}`;

    if (feedCache.has(cacheKey)) {
      const cachedData = feedCache.get(cacheKey);
      return res.status(200).json(cachedData);
    }

    let filter = { isApproved: true };

    if (country) filter.country = country;
    if (category) filter.category = category;
    if (language) filter.language = language;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const shops = await Shop.find(filter)
      .populate("category")
      .skip(skip)
      .limit(limitNum)
      .lean();

    const transformedShops = shops.map((shop) => ({
      ...shop,
      id: shop._id.toString(),
      vendorId: shop.vendorId ? shop.vendorId.toString() : null,
    }));

    const response = {
      success: true,
      data: transformedShops,
      message: "Shops retrieved successfully",
    };

    // Cache for 60 seconds (shops change less frequently)
    feedCache.set(cacheKey, response, 60);

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getShopById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined" || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop ID",
      });
    }

    const shop = await Shop.findById(id)
      .populate("category")
      .populate("vendorId", "name");

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    const transformedShop = {
      ...shop.toObject(),
      id: shop._id.toString(),
    };

    res.status(200).json({
      success: true,
      data: transformedShop,
      message: "Shop retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create shop
export const createShop = async (req, res) => {
  try {
    let logoUrl = req.body.logo;

    if (req.file) {
      try {
        console.log("Uploading shop logo to Cloudinary:", req.file.path);
        console.log("File details:", {
          name: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        });
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "image",
          folder: "shops/logos",
          quality: "auto",
        });
        console.log("Cloudinary upload successful:", uploadResult.secure_url);
        logoUrl = uploadResult.secure_url;

        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log("Local file cleaned up:", req.file.path);
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        console.error("File details:", req.file);
        return res.status(500).json({
          success: false,
          message:
            "Failed to upload logo to Cloudinary: " + uploadError.message,
        });
      }
    }

    const newShop = new Shop({
      ...req.body,
      logo: logoUrl,
      vendorId: req.user.id,
    });
    const savedShop = await newShop.save();

    res.status(201).json({
      success: true,
      data: savedShop,
      message: "Shop created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update shop
export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // Check if user owns the shop or is admin
    if (shop.vendorId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    let updateData = { ...req.body };

    if (req.file) {
      try {
        console.log("Uploading shop logo to Cloudinary:", req.file.path);
        console.log("File details:", {
          name: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        });
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "image",
          folder: "shops/logos",
          quality: "auto",
        });
        console.log("Cloudinary upload successful:", uploadResult.secure_url);
        updateData.logo = uploadResult.secure_url;

        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log("Local file cleaned up:", req.file.path);
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        console.error("File details:", req.file);
        return res.status(500).json({
          success: false,
          message:
            "Failed to upload logo to Cloudinary: " + uploadError.message,
        });
      }
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true },
    )
      .populate("category")
      .populate("vendorId", "name");

    res.status(200).json({
      success: true,
      data: updatedShop,
      message: "Shop updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const adminCreateShop = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    let logoUrl = req.body.logo;

    if (req.file) {
      try {
        console.log("Uploading shop logo to Cloudinary:", req.file.path);
        console.log("File details:", {
          name: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        });
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "image",
          folder: "shops/logos",
          quality: "auto",
        });
        console.log("Cloudinary upload successful:", uploadResult.secure_url);
        logoUrl = uploadResult.secure_url;

        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log("Local file cleaned up:", req.file.path);
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        console.error("File details:", req.file);
        return res.status(500).json({
          success: false,
          message:
            "Failed to upload logo to Cloudinary: " + uploadError.message,
        });
      }
    }

    const newShop = new Shop({
      ...req.body,
      logo: logoUrl,
      vendorId: req.user.id, // Use admin as vendor for system shops
      isApproved: true, // Auto-approve admin created shops
    });

    const savedShop = await newShop.save();

    res.status(201).json({
      success: true,
      data: savedShop,
      message: "Shop created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteShop = async (req, res) => {
  try {
    await Shop.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Shop deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getShopReviews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined" || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop ID",
      });
    }

    const reviews = await Review.find({ shopId: id })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map((review) => ({
      id: review._id,
      shopId: review.shopId,
      userId: review.userId._id,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedReviews,
      message: "Reviews retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const submitShopReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const shopId = req.params.id;
    const userId = req.user.id;

    if (!shopId || shopId === "undefined" || shopId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop ID",
      });
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user already reviewed this shop
    const existingReview = await Review.findOne({ shopId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this shop",
      });
    }

    // Create new review
    const newReview = new Review({
      shopId,
      userId,
      userName: user.name,
      rating,
      comment,
    });

    await newReview.save();

    const allReviews = await Review.find({ shopId });
    const totalRating = allReviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );
    const avgRating = totalRating / allReviews.length;

    await Shop.findByIdAndUpdate(shopId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    res.status(201).json({
      success: true,
      data: {
        id: newReview._id,
        shopId: newReview.shopId,
        userId: newReview.userId,
        userName: newReview.userName,
        rating: newReview.rating,
        comment: newReview.comment,
        date: newReview.createdAt,
      },
      message: "Review submitted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
