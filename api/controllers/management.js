import Shop from "../models/Shop.js";
import ShopRequest from "../models/ShopRequest.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";

export const sendShopRequest = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Shop logo is required" });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "shop_logos",
    });

    const newRequest = new ShopRequest({
      ...req.body,
      logo: uploadResult.secure_url,
      status: "pending",
      requestedBy: req.user.id,
    });

    await newRequest.save();

    res.status(201).json({ message: "Shop request sent", request: newRequest });
  } catch (error) {
    console.error("Send shop request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const takeAction = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { requestId, action } = req.body;
    const request = await ShopRequest.findById(requestId);

    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = action;
    await request.save();

    if (action === "approved") {
      await createShopInternal(request);
    }

    res.status(200).json({ message: `Request ${action}`, request });
  } catch (error) {
    console.error("Take action error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createShopInternal = async (request) => {
  console.log("Creating shop for vendorId:", request.vendorId);

  const newShop = new Shop({
    name: request.name,
    category: request.category,
    vendorId: request.vendorId,
    logo: request.logo,
    description: request.description || "",
    link: request.link || "",
    location: request.location || "",
    city: request.city || "",
    country: request.country || "",
    supportedCountries: request.supportedCountries || [],
    isApproved: true,
  });

  const savedShop = await newShop.save();
  console.log("Created shop:", savedShop._id, "for user:", request.vendorId);

  const VendorProfile = (await import("../models/Vendor.js")).default;
  let vendorProfile = await VendorProfile.findOne({ userId: request.vendorId });

  if (!vendorProfile) {
    vendorProfile = new VendorProfile({
      userId: request.vendorId,
      shopId: savedShop._id,
      availableRolls: 0,
      totalRollsUsed: 0,
    });
    await vendorProfile.save();
    console.log("Created vendor profile with shop ID:", savedShop._id);
  } else {
    vendorProfile.shopId = savedShop._id;
    await vendorProfile.save();
    console.log("Updated vendor profile with shop ID:", savedShop._id);
  }

  return savedShop;
};

export const getShopRequests = async (req, res) => {
  try {
    const requests = await ShopRequest.find()
      .populate("vendorId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const formattedRequests = requests.map((request) => ({
      ...request,
      id: request._id.toString(),
      vendorId: request.vendorId ? request.vendorId._id.toString() : null,
    }));

    res.status(200).json({
      success: true,
      data: formattedRequests,
      message: "Shop requests retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const approveShopRequest = async (req, res) => {
  try {
    const request = await ShopRequest.findById(req.params.id);
    if (!request)
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });

    await createShopInternal(request);
    await ShopRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Request approved and shop created",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const rejectShopRequest = async (req, res) => {
  try {
    const request = await ShopRequest.findById(req.params.id);
    if (!request)
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });

    await ShopRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Request rejected",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
