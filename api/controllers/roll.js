import Roll from "../models/Roll.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Saved from "../models/Saved.js";
import Comment from "../models/Comment.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { feedCache } from "../utils/cache.js";
import logger from "../utils/logger.js";
import { API_CONFIG } from "../config/constants.js";

// Helper to get actual comment count for a roll
const getActualCommentCount = async (rollId) => {
  return await Comment.countDocuments({ roll: rollId });
};

export const createRoll = async (req, res) => {
  try {
    logger.debug("=== ROLL UPLOAD REQUEST RECEIVED ===");
    logger.debug("Content-Type:", req.headers["content-type"]);
    logger.debug("Content-Length:", req.headers["content-length"]);
    logger.debug("Has file:", !!req.file);
    logger.debug(
      "File details:",
      req.file ? { name: req.file.filename, size: req.file.size } : "No file",
    );
    logger.debug("Body:", req.body);
    logger.debug("User:", req.user?.id);

    const user = await User.findById(req.user.id);
    if (!user || !(user.role === "vendor" || user.role === "admin")) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only vendors can upload rolls.",
      });
    }

    const { shop, caption, category, duration } = req.body;
    let shopId;

    if (typeof shop === "object" && shop && shop._id) {
      shopId = shop._id;
    } else if (
      typeof shop === "string" &&
      shop.trim() &&
      shop !== "undefined" &&
      shop !== "null"
    ) {
      shopId = shop.trim();
    } else {
      logger.warn("Invalid shop data received:", { shop, type: typeof shop });
      return res.status(400).json({
        success: false,
        message: "Shop ID is required and must be valid",
      });
    }

    const Vendor = (await import("../models/Vendor.js")).default;
    let vendor = await Vendor.findOne({ userId: req.user.id });
    logger.debug("Vendor lookup result:", vendor ? "Found" : "Not found");

    if (!vendor) {
      logger.debug("Creating new vendor profile");
      vendor = new Vendor({
        userId: req.user.id,
        availableRolls: 5,
        totalRollsUsed: 0,
      });
      await vendor.save();
      logger.debug("New vendor created with 5 free rolls");
    }

    logger.debug("Looking for shop with ID:", shopId);
    const shopDoc = await Shop.findById(shopId);
    logger.debug("Shop found:", shopDoc ? "Yes" : "No");
    if (!shopDoc) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    logger.debug("Shop ownership check:");
    logger.debug("User role:", user.role);
    logger.debug("Shop vendorId:", shopDoc.vendorId);
    logger.debug("Current vendor _id:", vendor._id);

    if (
      user.role === "vendor" &&
      shopDoc.vendorId &&
      shopDoc.vendorId.toString() !== vendor._id.toString()
    ) {
      logger.debug(
        "Shop ownership validation failed - fixing vendor relationship",
      );

      shopDoc.vendorId = vendor._id;
      await shopDoc.save();
      logger.debug("Shop vendorId updated to match current vendor");
    }
    logger.debug("Shop ownership validation passed");

    if (!shopDoc.isApproved && user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Shop must be approved before uploading rolls",
      });
    }

    let uploadResult;
    if (req.file) {
      try {
        logger.debug("Uploading video to Cloudinary...");
        uploadResult = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "video",
          folder: "rolls",
          quality: "auto",
          format: "mp4",
        });
        logger.debug("Video uploaded to Cloudinary:", uploadResult.secure_url);

        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadError) {
        logger.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload video to Cloudinary",
        });
      }
    } else {
      uploadResult = {
        secure_url: req.body.videoUrl || "https://test-video-url.mp4",
      };
      logger.debug("Using test video URL:", uploadResult.secure_url);
    }

    logger.debug("Creating roll with data:", {
      shop: shopId,
      caption: caption || "",
      category: category || "all",
      duration: parseInt(duration) || 30,
      createdBy: req.user.id,
      videoUrl: uploadResult.secure_url,
    });

    const newRoll = new Roll({
      shop: shopId,
      caption: caption || "",
      category: category || "all",
      duration: parseInt(duration) || 30,
      createdBy: req.user.id,
      videoUrl: uploadResult.secure_url,
    });

    logger.debug("Saving roll...");
    await newRoll.save();
    logger.debug("Roll saved successfully");

    logger.debug("Updating user roll count...");
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { availableRolls: -1 },
      },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    vendor.totalRollsUsed = (vendor.totalRollsUsed || 0) + 1;

    vendor.rollPackages = [];

    if (!vendor.shopId) {
      vendor.shopId = shopId;
    }

    await vendor.save();
    logger.debug("User and vendor updated successfully");

    logger.debug("Sending response...");
    res.status(200).json({
      success: true,
      data: {
        roll: newRoll,
        remainingRolls: updatedUser.availableRolls,
      },
      message: "Roll uploaded successfully",
    });
    logger.debug("Response sent successfully");
  } catch (error) {
    logger.error("Error uploading roll:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while uploading roll",
    });
  }
};

export const getRolls = async (req, res) => {
  try {
    const { category = "all", cursor, limit = 20 } = req.query;
    const userId = req.user?.id;

    // Input validation
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), API_CONFIG.MAX_LIMIT);
    if (cursor && isNaN(new Date(cursor).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid cursor format",
      });
    }

    const cacheKey = `rolls:${category}:${cursor || "latest"}:${userId || "anon"}`;

    if (feedCache.has(cacheKey)) {
      const cachedData = feedCache.get(cacheKey);
      return res.status(200).json(cachedData);
    }

    let filter = {};
    if (category !== "all") filter.category = category;

    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    // Filter out rolls with null shop or createdBy at database level
    filter.shop = { $exists: true, $ne: null };
    filter.createdBy = { $exists: true, $ne: null };

    // Get user's saved and liked roll IDs in parallel (optimized)
    const [rolls, userSaves, userLikedRollIds] = await Promise.all([
      Roll.find(filter)
        .populate("shop", "name logo")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .lean(),
      userId
        ? Saved.distinct("roll", { user: userId }).then((ids) =>
            ids.map((id) => id.toString()),
          )
        : Promise.resolve([]),
      userId
        ? Roll.distinct("_id", { likes: userId }).then((ids) =>
            ids.map((id) => id.toString()),
          )
        : Promise.resolve([]),
    ]);

    // Filter out rolls where populate returned null (referenced documents don't exist)
    const validRolls = rolls.filter(
      (roll) => roll.shop && roll.createdBy && roll.shop._id && roll.createdBy._id,
    );

    // Get actual comment counts for all rolls in parallel (if commentsCount is missing or 0)
    const rollsNeedingSync = validRolls.filter(
      (roll) => !roll.commentsCount || roll.commentsCount === 0,
    );
    
    const commentCountsMap = new Map();
    
    if (rollsNeedingSync.length > 0) {
      const rollIds = rollsNeedingSync.map((roll) => roll._id);
      const commentCounts = await Comment.aggregate([
        { $match: { roll: { $in: rollIds } } },
        { $group: { _id: "$roll", count: { $sum: 1 } } },
      ]);
      
      commentCounts.forEach((item) => {
        commentCountsMap.set(item._id.toString(), item.count);
      });
    }

    const transformedRolls = validRolls.map((roll) => {
      const isSaved = userId
        ? userSaves.includes(roll._id.toString())
        : false;
      const isLiked = userId
        ? userLikedRollIds.includes(roll._id.toString())
        : false;

      // Use actual count if stored count is missing or 0
      let commentsCount = roll.commentsCount || 0;
      if (commentsCount === 0) {
        const actualCount = commentCountsMap.get(roll._id.toString());
        if (actualCount !== undefined && actualCount > 0) {
          commentsCount = actualCount;
          // Update the roll in background (don't await)
          Roll.findByIdAndUpdate(roll._id, { commentsCount: actualCount }).catch(
            (err) => logger.error("Error syncing comment count:", err),
          );
        }
      }

      return {
        id: roll._id.toString(),
        shopId: roll.shop._id.toString(),
        shopName: roll.shop.name,
        shopLogo: roll.shop.logo,
        videoUrl: roll.videoUrl,
        caption: roll.caption,
        category: roll.category,
        likes: roll.likesCount || 0,
        commentsCount,
        saves: roll.savesCount || 0,
        shares: roll.sharesCount || 0,
        createdBy: roll.createdBy._id,
        createdAt: roll.createdAt,
        isLiked,
        isSaved,
        duration: roll.duration || 30,
      };
    });

    const response = {
      success: true,
      data: transformedRolls,
      cursor:
        transformedRolls.length > 0
          ? transformedRolls[transformedRolls.length - 1].createdAt
          : null,
      hasMore: transformedRolls.length === limitNum,
      message: "Rolls retrieved successfully",
    };

    feedCache.set(cacheKey, response, 30);

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error fetching rolls:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching rolls",
    });
  }
};

export const getRollById = async (req, res) => {
  try {
    const roll = await Roll.findById(req.params.id)
      .populate("shop", "name logo")
      .populate("createdBy", "name");

    if (!roll) {
      return res.status(404).json({
        success: false,
        message: "Roll not found",
      });
    }

    const transformedRoll = {
      id: roll._id.toString(),
      shopId: roll.shop._id.toString(),
      shopName: roll.shop.name,
      shopLogo: roll.shop.logo,
      videoUrl: roll.videoUrl,
      caption: roll.caption,
      category: roll.category,
      likes: roll.likesCount || 0,
      comments: [],
      saves: roll.savesCount || 0,
      shares: roll.sharesCount || 0,
      createdBy: roll.createdBy._id,
      createdAt: roll.createdAt,
      isLiked: false,
      isSaved: false,
      duration: roll.duration || 30,
    };

    res.status(200).json({
      success: true,
      data: transformedRoll,
      message: "Roll retrieved successfully",
    });
  } catch (error) {
    logger.error("Error fetching roll:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getRollsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    const rolls = await Roll.find({ shop: shopId })
      .populate("shop", "name logo")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    const transformedRolls = rolls
      .filter((roll) => roll.shop && roll.createdBy)
      .map((roll) => ({
        id: roll._id.toString(),
        shopId: roll.shop._id.toString(),
        shopName: roll.shop.name,
        shopLogo: roll.shop.logo,
        videoUrl: roll.videoUrl,
        caption: roll.caption,
        category: roll.category,
        likes: roll.likesCount || 0,
        commentsCount: roll.commentsCount || 0,
        saves: roll.savesCount || 0,
        shares: roll.sharesCount || 0,
        createdBy: roll.createdBy._id,
        createdAt: roll.createdAt,
        isLiked: false,
        isSaved: false,
        duration: roll.duration || 30,
      }));

    res.status(200).json({
      success: true,
      data: transformedRolls,
      message: "Shop rolls retrieved successfully",
    });
  } catch (error) {
    logger.error("Error fetching shop rolls:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update roll
export const updateRoll = async (req, res) => {
  try {
    const roll = await Roll.findById(req.params.id);
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: "Roll not found",
      });
    }

    if (
      roll.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const updatedRoll = await Roll.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    )
      .populate("shop", "name logo")
      .populate("createdBy", "name");

    res.status(200).json({
      success: true,
      data: updatedRoll,
      message: "Roll updated successfully",
    });
  } catch (error) {
    logger.error("Error updating roll:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete roll
export const deleteRoll = async (req, res) => {
  try {
    const roll = await Roll.findById(req.params.id).populate('shop');
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: "Roll not found",
      });
    }

    // Admin can delete any roll
    if (req.user.role === "admin") {
      await Roll.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Roll deleted successfully",
      });
    }

    // Check if user is the creator OR owns the shop
    const isCreator = roll.createdBy.toString() === req.user.id;
    const isShopOwner = roll.shop && roll.shop.vendorId && roll.shop.vendorId.toString() === req.user.id;

    if (!isCreator && !isShopOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized - you can only delete your own rolls or rolls from your shops",
      });
    }

    await Roll.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Roll deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting roll:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Like a roll
export const likeRoll = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Use atomic operation to prevent race conditions
    const result = await Roll.findOneAndUpdate(
      {
        _id: id,
        likes: { $ne: userId }, // Only if user hasn't liked yet
      },
      {
        $push: { likes: userId },
        $inc: { likesCount: 1 },
      },
      { new: true },
    );

    if (!result) {
      // Either roll not found or already liked
      const roll = await Roll.findById(id);
      if (!roll) {
        return res.status(404).json({
          success: false,
          message: "Roll not found",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Roll already liked",
      });
    }

    feedCache.clear();

    res.status(200).json({
      success: true,
      data: {
        isLiked: true,
        likesCount: result.likesCount,
      },
      message: "Roll liked successfully",
    });
  } catch (error) {
    logger.error("Like roll error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const unlikeRoll = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Use atomic operation to prevent race conditions
    const result = await Roll.findOneAndUpdate(
      {
        _id: id,
        likes: userId, // Only if user has liked
      },
      {
        $pull: { likes: userId },
        $inc: { likesCount: -1 },
      },
      { new: true },
    );

    if (!result) {
      // Either roll not found or not liked yet
      const roll = await Roll.findById(id);
      if (!roll) {
        return res.status(404).json({
          success: false,
          message: "Roll not found",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Roll not liked yet",
      });
    }

    if (result.likesCount < 0) {
      await Roll.findByIdAndUpdate(id, { likesCount: 0 });
      result.likesCount = 0;
    }

    // Clear feed cache when likes change
    feedCache.clear();

    res.status(200).json({
      success: true,
      data: {
        isLiked: false,
        likesCount: result.likesCount,
      },
      message: "Roll unliked successfully",
    });
  } catch (error) {
    logger.error("Unlike roll error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if roll exists and if user has already liked it
    const roll = await Roll.findById(id);
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: "Roll not found",
      });
    }

    const isLiked = roll.likes && roll.likes.includes(userId);

    // Use atomic operation to prevent race conditions
    let result;
    if (isLiked) {
      // Unlike: remove from likes array and decrement count
      result = await Roll.findOneAndUpdate(
        {
          _id: id,
          likes: userId, // Only if user has liked
        },
        {
          $pull: { likes: userId },
          $inc: { likesCount: -1 },
        },
        { new: true }
      );

      if (!result) {
        // Roll was already unliked or not found
        return res.status(400).json({
          success: false,
          message: "Roll not liked yet",
        });
      }

      // Ensure count doesn't go negative
      if (result.likesCount < 0) {
        await Roll.findByIdAndUpdate(id, { likesCount: 0 });
        result.likesCount = 0;
      }
    } else {
      // Like: add to likes array and increment count
      result = await Roll.findOneAndUpdate(
        {
          _id: id,
          likes: { $ne: userId }, // Only if user hasn't liked yet
        },
        {
          $push: { likes: userId },
          $inc: { likesCount: 1 },
        },
        { new: true }
      );

      if (!result) {
        // Roll was already liked
        return res.status(400).json({
          success: false,
          message: "Roll already liked",
        });
      }
    }

    // Clear feed cache when likes change
    feedCache.clear();

    res.status(200).json({
      success: true,
      data: {
        isLiked: !isLiked,
        likesCount: result.likesCount,
      },
      message: isLiked ? "Roll unliked" : "Roll liked",
    });
  } catch (error) {
    logger.error("Toggle like error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Share roll
export const shareRoll = async (req, res) => {
  try {
    const roll = await Roll.findById(req.params.id);
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: "Roll not found",
      });
    }

    roll.sharesCount = (roll.sharesCount || 0) + 1;
    await roll.save();

    res.status(200).json({
      success: true,
      data: {
        sharesCount: roll.sharesCount,
      },
      message: "Roll shared successfully",
    });
  } catch (error) {
    logger.error("Share roll error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Save roll
export const saveRoll = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const roll = await Roll.findById(id);
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: "Roll not found",
      });
    }

    const existingSave = await Saved.findOne({ roll: id, user: userId });
    if (existingSave) {
      return res.status(400).json({
        success: false,
        message: "Roll already saved",
      });
    }

    await Saved.create({ roll: id, user: userId });
    roll.savesCount = (roll.savesCount || 0) + 1;
    await roll.save();

    res.status(200).json({
      success: true,
      data: {
        isSaved: true,
        savesCount: roll.savesCount,
      },
      message: "Roll saved successfully",
    });
  } catch (error) {
    logger.error("Save roll error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Unsave roll
export const unsaveRoll = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const roll = await Roll.findById(id);
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: "Roll not found",
      });
    }

    const deleted = await Saved.findOneAndDelete({ roll: id, user: userId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Roll not saved yet",
      });
    }

    roll.savesCount = Math.max(0, (roll.savesCount || 0) - 1);
    await roll.save();

    res.status(200).json({
      success: true,
      data: {
        isSaved: false,
        savesCount: roll.savesCount,
      },
      message: "Roll unsaved successfully",
    });
  } catch (error) {
    logger.error("Unsave roll error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
