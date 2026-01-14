import Shop from "../models/Shop.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import WeeklyShopShare from "../models/WeeklyShopShare.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { feedCache } from "../utils/cache.js";
import logger from "../utils/logger.js";
import { normalizeCountryToCode } from "../utils/countryUtils.js";

// Get all shops
export const getShops = async (req, res) => {
  try {
    const { category, language, page = 1, limit = 10 } = req.query;

    const cacheKey = `shops:${category || "all"}:${language || "all"}:${page}:${limit}`;

    if (feedCache.has(cacheKey)) {
      return res.status(200).json(feedCache.get(cacheKey));
    }

    const filter = { isApproved: true };

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
      vendorId: shop.vendorId?.toString() || null,
    }));

    const response = {
      success: true,
      data: transformedShops,
      message: "Shops retrieved successfully",
    };

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

export const shareShop = async (req, res) => {
  try {
    const { id } = req.params;
    let { country } = req.body;

    // Priority: If user is authenticated, ALWAYS use their account country from database
    if (req.user) {
      const user = await User.findById(req.user.id).select("country");
      if (user && user.country) {
        country = user.country;
        logger.debug(
          "Using authenticated user's account country for share:",
          country,
        );
      } else {
        logger.warn("Authenticated user has no country in account for share");
      }
    }

    if (!id || id === "undefined" || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop ID",
      });
    }

    const shop = await Shop.findByIdAndUpdate(
      id,
      { $inc: { shareCount: 1 } },
      { new: true },
    );

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // Track weekly share if country is provided
    if (country) {
      // Normalize country to code format (e.g., "US", "AF") for consistency
      const normalizedCountry = normalizeCountryToCode(country);

      if (!normalizedCountry) {
        logger.warn("Invalid country provided for share:", country);
      } else {
        const now = new Date();
        const weekStart = new Date(now);
        const dayOfWeek = now.getUTCDay(); // 0 = Sunday
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        weekStart.setUTCDate(now.getUTCDate() - daysToMonday);
        weekStart.setUTCHours(0, 0, 0, 0);
        weekStart.setUTCMilliseconds(0);

        await WeeklyShopShare.findOneAndUpdate(
          {
            shopId: id,
            country: normalizedCountry,
            weekStart,
          },
          { $inc: { shareCount: 1 } },
          { upsert: true, new: true },
        );

        logger.debug(
          `Share recorded for shop ${id} in country ${normalizedCountry}`,
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        shareCount: shop.shareCount,
      },
      message: "Shop share recorded successfully",
    });
  } catch (error) {
    logger.error("Error sharing shop:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getTopSharedShopsOfWeek = async (req, res) => {
  try {
    let country = null;

    // Priority 1: If user is authenticated, ALWAYS use their account country from database
    if (req.user) {
      const user = await User.findById(req.user.id).select("country");
      if (user && user.country) {
        country = user.country;
        logger.debug(
          "Using authenticated user's account country from database:",
          country,
        );
      } else {
        logger.warn("Authenticated user has no country in account");
        return res.status(400).json({
          success: false,
          message:
            "User account has no country set. Please update your profile.",
        });
      }
    } else {
      // Priority 2: For guest users, use query parameter
      country = req.query.country;
      if (!country) {
        logger.warn("No country provided for guest user");
        return res.status(400).json({
          success: false,
          message: "Country parameter is required for guest users",
        });
      }
      logger.debug("Using country from query parameter (guest user):", country);
    }

    // Normalize country to code format for consistent querying
    const normalizedCountry = normalizeCountryToCode(country);

    if (!normalizedCountry) {
      logger.warn("Invalid country format:", country);
      return res.status(400).json({
        success: false,
        message: "Invalid country format",
      });
    }

    logger.debug(
      "Top shared shops API called - Original:",
      country,
      "Normalized:",
      normalizedCountry,
    );

    const cacheKey = `top-shared-shops:${normalizedCountry}`;

    if (feedCache.has(cacheKey)) {
      const cachedData = feedCache.get(cacheKey);
      logger.debug("Returning cached data for:", normalizedCountry);
      return res.status(200).json(cachedData);
    }

    // Calculate week start (Monday at 00:00:00 UTC)
    const now = new Date();
    const weekStart = new Date(now);
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6 days back
    weekStart.setUTCDate(now.getUTCDate() - daysToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCMilliseconds(0);

    logger.debug("Week start calculated:", weekStart.toISOString());
    logger.debug("Current date:", now.toISOString());

    // Query for the most recent week's shares
    // Some stored dates might have timezone issues (e.g., 21:00 UTC instead of 00:00 UTC)
    // Find the most recent weekStart for this country
    const mostRecentWeek = await WeeklyShopShare.findOne({
      country: normalizedCountry,
      shareCount: { $gt: 0 },
    })
      .sort({ weekStart: -1 })
      .select("weekStart")
      .lean();

    if (!mostRecentWeek) {
      logger.debug("No shares found for country:", normalizedCountry);
      return res.status(200).json({
        success: true,
        data: [],
        message: "No top shared shops found",
      });
    }

    logger.debug(
      "Most recent week found:",
      mostRecentWeek.weekStart.toISOString(),
    );
    logger.debug("Query params - Country:", normalizedCountry);

    // Simplified aggregation: Get top 10 shares for the most recent week
    const topShares = await WeeklyShopShare.aggregate([
      // Match shares for the most recent week
      {
        $match: {
          country: normalizedCountry,
          weekStart: mostRecentWeek.weekStart,
          shareCount: { $gt: 0 },
        },
      },
      // Sort by shareCount descending
      { $sort: { shareCount: -1 } },
      // Limit to top 10
      { $limit: 10 },
      // Lookup shop data
      {
        $lookup: {
          from: "shops",
          localField: "shopId",
          foreignField: "_id",
          as: "shop",
        },
      },
      // Filter only approved shops
      { $match: { "shop.isApproved": true } },
      // Unwind shop
      { $unwind: "$shop" },
      // Lookup category
      {
        $lookup: {
          from: "categories",
          localField: "shop.category",
          foreignField: "_id",
          as: "category",
        },
      },
      // Unwind category (optional)
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      // Project final structure
      {
        $project: {
          _id: "$_id",
          shopId: "$shop._id",
          shareCount: "$shareCount",
          weekStart: "$weekStart",
          shop: {
            _id: "$shop._id",
            name: "$shop.name",
            logo: "$shop.logo",
            description: "$shop.description",
            link: "$shop.link",
            rating: "$shop.rating",
            reviewCount: "$shop.reviewCount",
            shareCount: "$shop.shareCount",
            vendorId: "$shop.vendorId",
            isApproved: "$shop.isApproved",
            category: {
              _id: "$category._id",
              name: "$category.name",
            },
          },
        },
      },
    ]);

    logger.debug("Top shares found via aggregation:", topShares.length);

    // Transform aggregation results to match expected format
    const shops = topShares.map((item) => ({
      ...item.shop,
      id: item.shop._id.toString(),
      weeklyShares: item.shareCount,
      vendorId: item.shop.vendorId ? item.shop.vendorId.toString() : null,
      category: item.shop.category
        ? {
            id: item.shop.category._id?.toString(),
            name: item.shop.category.name,
          }
        : null,
    }));

    logger.debug("Final response shops:", shops.length);

    const response = {
      success: true,
      data: shops,
      message: "Top shared shops retrieved successfully",
    };

    // Cache for 1 hour
    feedCache.set(cacheKey, response, 3600);

    res.status(200).json(response);
  } catch (error) {
    logger.error("Top shared shops error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching top shared shops",
    });
  }
};
