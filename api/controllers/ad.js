import Ad from "../models/Ad.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Get all active ads
export const getActiveAds = async (req, res) => {
  try {
    const { country, language } = req.query;
    const userId = req.user?.id;

    const ads = await Ad.find({ isActive: true })
      .populate("shopId", "name logo country language")
      .limit(100)
      .lean();

    // Get user's favorite shops if authenticated
    let favoriteShopIds = [];
    if (userId) {
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(userId).select("favorites");
      favoriteShopIds = user?.favorites?.map((id) => id.toString()) || [];
    }

    // Transform ads with priority sorting
    const formattedAds = ads
      .map((ad) => {
        const isFavorite =
          ad.shopId && favoriteShopIds.includes(ad.shopId._id.toString());
        const matchesCountry =
          country && ad.shopId && ad.shopId.country === country;
        const matchesLanguage =
          language && ad.shopId && ad.shopId.language === language;

        return {
          ...ad,
          id: ad._id.toString(),
          shopId: ad.shopId ? ad.shopId._id.toString() : null,
          createdAt: ad.createdAt.toISOString().split("T")[0],
          sortPriority:
            isFavorite && matchesCountry && matchesLanguage
              ? 1
              : isFavorite && matchesCountry
                ? 2
                : isFavorite && matchesLanguage
                  ? 3
                  : isFavorite
                    ? 4
                    : matchesCountry && matchesLanguage
                      ? 5
                      : matchesCountry
                        ? 6
                        : matchesLanguage
                          ? 7
                          : 8,
          originalPriority: ad.priority,
        };
      })
      .sort((a, b) => {
        if (a.sortPriority !== b.sortPriority) {
          return a.sortPriority - b.sortPriority;
        }
        // Secondary sort by original priority, then creation date
        if (a.originalPriority !== b.originalPriority) {
          return b.originalPriority - a.originalPriority;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 20)
      .map((ad) => {
        const { sortPriority, originalPriority, ...adWithoutPriority } = ad;
        return adWithoutPriority;
      });

    res.status(200).json({
      success: true,
      data: formattedAds,
      message: "Active ads retrieved successfully",
    });
  } catch (error) {
    console.error("Get active ads error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all ads (Admin only)
export const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find()
      .populate("shopId", "name logo")
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    const formattedAds = ads.map((ad) => ({
      ...ad,
      id: ad._id.toString(),
      shopId: ad.shopId ? ad.shopId._id.toString() : null,
      createdAt: ad.createdAt.toISOString().split("T")[0],
    }));

    res.status(200).json({
      success: true,
      data: formattedAds,
      message: "All ads retrieved successfully",
    });
  } catch (error) {
    console.error("Get all ads error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create new ad (Admin only)
export const createAd = async (req, res) => {
  try {
    console.log("=== AD CREATION REQUEST ===");
    console.log("Request body:", req.body);
    console.log(
      "Request file:",
      req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
          }
        : "NO FILE",
    );
    console.log("User:", req.user?.id, req.user?.role);

    const { title, linkType, linkUrl, shopId, priority } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    let imageUrl = req.body.image;

    // Handle image upload to Cloudinary
    if (req.file) {
      try {
        console.log("Uploading ad image to Cloudinary:", req.file.path);
        console.log("File details:", {
          name: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        });
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "image",
          folder: "ads",
          quality: "auto",
        });
        console.log("Cloudinary upload successful:", uploadResult.secure_url);
        imageUrl = uploadResult.secure_url;

        // Clean up local file
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
            "Failed to upload image to Cloudinary: " + uploadError.message,
        });
      }
    } else {
      console.log("No file provided in request");
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    console.log("Creating ad with imageUrl:", imageUrl);
    const newAd = new Ad({
      title,
      image: imageUrl,
      linkType: linkType || "internal",
      linkUrl,
      shopId,
      priority: priority || 1,
      createdBy: req.user.id,
    });

    await newAd.save();
    console.log("Ad saved successfully:", newAd._id);

    res.status(201).json({
      success: true,
      message: "Ad created successfully",
      data: {
        ...newAd.toObject(),
        id: newAd._id.toString(),
      },
    });
  } catch (error) {
    console.error("Create ad error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update ad (Admin only)
export const updateAd = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Handle image upload to Cloudinary if new file provided
    if (req.file) {
      try {
        console.log("Uploading ad image to Cloudinary:", req.file.path);
        console.log("File details:", {
          name: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        });
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "image",
          folder: "ads",
          quality: "auto",
        });
        console.log("Cloudinary upload successful:", uploadResult.secure_url);
        updateData.image = uploadResult.secure_url;

        // Clean up local file
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
            "Failed to upload image to Cloudinary: " + uploadError.message,
        });
      }
    }

    const updatedAd = await Ad.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    ).lean();

    if (!updatedAd) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ad updated successfully",
      data: {
        ...updatedAd,
        id: updatedAd._id.toString(),
      },
    });
  } catch (error) {
    console.error("Update ad error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete ad (Admin only)
export const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAd = await Ad.findByIdAndDelete(id);

    if (!deletedAd) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (error) {
    console.error("Delete ad error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
