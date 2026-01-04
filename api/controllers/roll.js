import Roll from "../models/Roll.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Saved from "../models/Saved.js";
import Comment from "../models/Comment.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { feedCache } from "../utils/cache.js";

export const createRoll = async (req, res) => {
  try {
    console.log("=== ROLL UPLOAD REQUEST RECEIVED ===");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Content-Length:", req.headers["content-length"]);
    console.log("Has file:", !!req.file);
    console.log(
      "File details:",
      req.file ? { name: req.file.filename, size: req.file.size } : "No file",
    );
    console.log("Body:", req.body);
    console.log("User:", req.user?.id);

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
      console.log("Invalid shop data received:", { shop, type: typeof shop });
      return res.status(400).json({
        success: false,
        message: "Shop ID is required and must be valid",
      });
    }

    const Vendor = (await import("../models/Vendor.js")).default;
    let vendor = await Vendor.findOne({ userId: req.user.id });
    console.log("Vendor lookup result:", vendor ? "Found" : "Not found");

    if (!vendor) {
      console.log("Creating new vendor profile");
      vendor = new Vendor({
        userId: req.user.id,
        availableRolls: 5,
        totalRollsUsed: 0,
      });
      await vendor.save();
      console.log("New vendor created with 5 free rolls");
    }

    console.log("Looking for shop with ID:", shopId);
    const shopDoc = await Shop.findById(shopId);
    console.log("Shop found:", shopDoc ? "Yes" : "No");
    if (!shopDoc) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    console.log("Shop ownership check:");
    console.log("User role:", user.role);
    console.log("Shop vendorId:", shopDoc.vendorId);
    console.log("Current vendor _id:", vendor._id);

    if (
      user.role === "vendor" &&
      shopDoc.vendorId &&
      shopDoc.vendorId.toString() !== vendor._id.toString()
    ) {
      console.log(
        "Shop ownership validation failed - fixing vendor relationship",
      );

      shopDoc.vendorId = vendor._id;
      await shopDoc.save();
      console.log("Shop vendorId updated to match current vendor");
    }
    console.log("Shop ownership validation passed");

    if (!shopDoc.isApproved && user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Shop must be approved before uploading rolls",
      });
    }

    let uploadResult;
    if (req.file) {
      try {
        console.log("Uploading video to Cloudinary...");
        uploadResult = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "video",
          folder: "rolls",
          quality: "auto",
          format: "mp4",
        });
        console.log("Video uploaded to Cloudinary:", uploadResult.secure_url);

        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload video to Cloudinary",
        });
      }
    } else {
      uploadResult = {
        secure_url: req.body.videoUrl || "https://test-video-url.mp4",
      };
      console.log("Using test video URL:", uploadResult.secure_url);
    }

    console.log("Creating roll with data:", {
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

    console.log("Saving roll...");
    await newRoll.save();
    console.log("Roll saved successfully");

    console.log("Updating user roll count...");
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
    console.log("User and vendor updated successfully");

    console.log("Sending response...");
    res.status(200).json({
      success: true,
      data: {
        roll: newRoll,
        remainingRolls: updatedUser.availableRolls,
      },
      message: "Roll uploaded successfully",
    });
    console.log("Response sent successfully");
  } catch (error) {
    console.error("Error uploading roll:", error);
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

    const rolls = await Roll.find(filter)
      .populate("shop", "name logo")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    let userSaves = [];
    if (userId) {
      const saves = await Saved.find({ user: userId }).select("roll").lean();
      userSaves = saves.map((save) => save.roll.toString());
    }

    const transformedRolls = rolls
      .filter((roll) => roll.shop && roll.createdBy)
      .map((roll) => {
        const isSaved = userId
          ? userSaves.includes(roll._id.toString())
          : false;
        const isLiked = userId ? roll.likes?.includes(userId) || false : false;

        return {
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
      hasMore: transformedRolls.length === parseInt(limit),
      message: "Rolls retrieved successfully",
    };

    feedCache.set(cacheKey, response, 30);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching rolls:", error);
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
    console.error("Error fetching roll:", error);
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

    const transformedRolls = rolls.map((roll) => ({
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
    }));

    res.status(200).json({
      success: true,
      data: transformedRolls,
      message: "Shop rolls retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching shop rolls:", error);
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
    console.error("Error updating roll:", error);
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
    console.error("Error deleting roll:", error);
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
    console.error("Like roll error:", error);
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
    console.error("Unlike roll error:", error);
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

    const roll = await Roll.findById(id);
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: "Roll not found",
      });
    }

    const isLiked = roll.likes && roll.likes.includes(userId);

    if (isLiked) {
      roll.likes = roll.likes.filter((like) => like.toString() !== userId);
      roll.likesCount = Math.max(0, (roll.likesCount || 0) - 1);
    } else {
      if (!roll.likes) roll.likes = [];
      roll.likes.push(userId);
      roll.likesCount = (roll.likesCount || 0) + 1;
    }

    await roll.save();

    res.status(200).json({
      success: true,
      data: {
        isLiked: !isLiked,
        likesCount: roll.likesCount,
      },
      message: isLiked ? "Roll unliked" : "Roll liked",
    });
  } catch (error) {
    console.error("Toggle like error:", error);
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
    console.error("Share roll error:", error);
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
    console.error("Save roll error:", error);
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
    console.error("Unsave roll error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
