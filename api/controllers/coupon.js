import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import { API_CONFIG } from "../config/constants.js";
import {
  handleCloudinaryUpload,
  getUserFavoriteShopIds,
  transformCoupon,
  sortAndLimitItems,
} from "../utils/helpers.js";
import fs from "fs";

export const createCoupon = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (
      !user ||
      !(
        user.role === API_CONFIG.ROLES.VENDOR ||
        user.role === API_CONFIG.ROLES.ADMIN
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { shop, code, description, discount, expiryDate } = req.body;
    let imageUrl = req.body.image || "";

    // For vendors, verify they own the shop
    if (user.role === API_CONFIG.ROLES.VENDOR) {
      const Shop = (await import("../models/Shop.js")).default;
      const shopDoc = await Shop.findById(shop);
      if (!shopDoc || shopDoc.vendorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You can only create coupons for your own shop",
        });
      }
    }

    if (req.file) {
      try {
        imageUrl = await handleCloudinaryUpload(
          req.file,
          API_CONFIG.FOLDERS.COUPONS,
          cloudinary,
        );
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: uploadError.message,
        });
      }
    }

    if (!shop || !code || !discount || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const isExpired = new Date(expiryDate) < new Date();

    const coupon = new Coupon({
      image: imageUrl,
      shop,
      code,
      description,
      discount,
      expiryDate,
      isExpired,
    });

    await coupon.save();
    res.status(200).json({
      success: true,
      data: coupon,
      message: "Coupon created successfully",
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const { country, language, page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), API_CONFIG.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    const totalCoupons = await Coupon.countDocuments({ isExpired: { $ne: true } });
    
    const coupons = await Coupon.find({ isExpired: { $ne: true } })
      .populate("shop", "name logo country language")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const favoriteShopIds = await getUserFavoriteShopIds(userId);

    const transformedCoupons = coupons.map((coupon) =>
      transformCoupon(coupon, favoriteShopIds, country, language),
    );

    res.status(200).json({
      success: true,
      data: transformedCoupons,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCoupons / limitNum),
        totalItems: totalCoupons,
        hasNextPage: pageNum < Math.ceil(totalCoupons / limitNum),
        hasPrevPage: pageNum > 1
      },
      message: "Coupons retrieved successfully",
    });
  } catch (error) {
    console.error("Get Coupons Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).populate(
      "shop",
      "name logo",
    );
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const transformedCoupon = {
      id: coupon._id,
      shopId: coupon.shop._id,
      shopName: coupon.shop.name,
      code: coupon.code,
      description: coupon.description,
      discount: coupon.discount,
      expiryDate: coupon.expiryDate,
      isExpired: coupon.isExpired,
    };

    res.status(200).json({
      success: true,
      data: transformedCoupon,
      message: "Coupon retrieved successfully",
    });
  } catch (error) {
    console.error("Get Coupon Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (req.user.role !== API_CONFIG.ROLES.ADMIN) {
      const Shop = (await import("../models/Shop.js")).default;
      const shop = await Shop.findById(coupon.shop);
      if (!shop || shop.vendorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized",
        });
      }
    }

    let updateData = { ...req.body };

    if (req.file) {
      try {
        updateData.image = await handleCloudinaryUpload(
          req.file,
          API_CONFIG.FOLDERS.COUPONS,
          cloudinary,
        );
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: uploadError.message,
        });
      }
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true },
    ).populate("shop", "name logo");

    if (!updatedCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedCoupon,
      message: "Coupon updated successfully",
    });
  } catch (error) {
    console.error("Update Coupon Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (req.user.role !== API_CONFIG.ROLES.ADMIN) {
      const Shop = (await import("../models/Shop.js")).default;
      const shop = await Shop.findById(coupon.shop);
      if (!shop || shop.vendorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized",
        });
      }
    }

    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete Coupon Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
