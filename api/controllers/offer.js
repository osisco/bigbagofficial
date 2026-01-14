import Offer from "../models/Offer.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import { v2 as cloudinary } from "cloudinary";
import { API_CONFIG } from "../config/constants.js";
import {
  handleCloudinaryUpload,
  getUserFavoriteShopIds,
  transformOffer,
  sortAndLimitItems,
} from "../utils/helpers.js";

export const createOffer = async (req, res) => {
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

    const {
      shop,
      title,
      description,
      discount,
      originalPrice,
      salePrice,
      expiryDate,
      isLimited,
    } = req.body;

    if (user.role === API_CONFIG.ROLES.VENDOR) {
      const shopDoc = await Shop.findById(shop);
      if (!shopDoc || shopDoc.vendorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You can only create offers for your own shop",
        });
      }
    }

    let imageUrl = req.body.image || "";

    if (req.file) {
      try {
        imageUrl = await handleCloudinaryUpload(
          req.file,
          API_CONFIG.FOLDERS.OFFERS,
          cloudinary,
        );
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: uploadError.message,
        });
      }
    }

    const offer = new Offer({
      shop,
      title,
      description,
      discount,
      originalPrice,
      salePrice,
      image: imageUrl,
      expiryDate,
      isLimited,
    });

    await offer.save();

    return res.status(200).json({
      success: true,
      data: offer,
      message: "Offer created successfully",
    });
  } catch (error) {
    console.error("Offer creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all Offers
export const getOffers = async (req, res) => {
  try {
    const { country, language } = req.query;
    const userId = req.user?.id;

    const offers = await Offer.find({})
      .populate("shop", "name logo country language")
      .limit(API_CONFIG.MAX_LIMIT);

    const favoriteShopIds = await getUserFavoriteShopIds(userId);

    const transformedOffers = offers.map((offer) =>
      transformOffer(offer, favoriteShopIds, country, language),
    );

    const sortedAndLimitedOffers = sortAndLimitItems(transformedOffers);

    res.status(200).json({
      success: true,
      data: sortedAndLimitedOffers,
      message: "Offers retrieved successfully",
    });
  } catch (error) {
    console.error("Get offers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get offer by ID
export const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "shop",
      "name logo",
    );
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    const transformedOffer = {
      id: offer._id,
      shopId: offer.shop._id,
      shopName: offer.shop.name,
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      originalPrice: offer.originalPrice,
      salePrice: offer.salePrice,
      image: offer.image,
      expiryDate: offer.expiryDate,
      isLimited: offer.isLimited,
    };

    res.status(200).json({
      success: true,
      data: transformedOffer,
      message: "Offer retrieved successfully",
    });
  } catch (error) {
    console.error("Get offer error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getOffersByShop = async (req, res) => {
  try {
    const offers = await Offer.find({ shop: req.params.shopId })
      .populate("shop", "name logo")
      .sort({ createdAt: -1 });

    const transformedOffers = offers.map((offer) => ({
      id: offer._id,
      shopId: offer.shop._id,
      shopName: offer.shop.name,
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      originalPrice: offer.originalPrice,
      salePrice: offer.salePrice,
      image: offer.image,
      expiryDate: offer.expiryDate,
      isLimited: offer.isLimited,
    }));

    res.status(200).json({
      success: true,
      data: transformedOffers,
      message: "Shop offers retrieved successfully",
    });
  } catch (error) {
    console.error("Get shop offers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (req.user.role !== API_CONFIG.ROLES.ADMIN) {
      const shop = await Shop.findById(offer.shop);
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
          API_CONFIG.FOLDERS.OFFERS,
          cloudinary,
        );
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: uploadError.message,
        });
      }
    }

    const updatedOffer = await Offer.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true },
    ).populate("shop", "name logo");

    res.status(200).json({
      success: true,
      data: updatedOffer,
      message: "Offer updated successfully",
    });
  } catch (error) {
    console.error("Update offer error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (req.user.role !== API_CONFIG.ROLES.ADMIN) {
      const shop = await Shop.findById(offer.shop);
      if (!shop || shop.vendorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized",
        });
      }
    }

    await Offer.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    console.error("Delete offer error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
