import Vendor from "../models/Vendor.js";
import RollPackage from "../models/RollPackage.js";
import ShopRequest from "../models/ShopRequest.js";
import Shop from "../models/Shop.js";

// Create Vendor Profile
export const createVendorProfile = async (req, res) => {
  try {
    if (req.user.role !== "vendor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const newVendorProfile = new Vendor(req.body);
    await newVendorProfile.save();

    return res.status(201).json({
      message: "Vendor profile created successfully",
      vendor: newVendorProfile,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add Roll Package
export const addRollPackage = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "vendor") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { isPaid, ...packageData } = req.body;
    if (!isPaid) {
      return res.status(400).json({ message: "Invalid payment credentials" });
    }

    const newRollPackage = new RollPackage(packageData);
    await newRollPackage.save();

    return res.status(201).json({
      message: "Roll package added successfully",
      package: newRollPackage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Spend a Roll
export const spendRoll = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.availableRolls <= 0) {
      return res.status(400).json({
        success: false,
        message: "No rolls available. Please purchase a roll package.",
      });
    }

    vendor.availableRolls -= 1;
    vendor.totalRollsUsed = (vendor.totalRollsUsed || 0) + 1;
    await vendor.save();

    return res.status(200).json({
      success: true,
      data: {
        availableRolls: vendor.availableRolls,
        totalRollsUsed: vendor.totalRollsUsed,
      },
      message: "Roll spent successfully",
    });
  } catch (error) {
    console.error("Spend roll error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while spending roll",
    });
  }
};

// Get vendor profile
export const getVendorProfile = async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(req.user.id).select(
      "availableRolls totalShares",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let vendor = await Vendor.findOne({ userId: req.user.id });

    // If no vendor profile exists, create one automatically
    if (!vendor) {
      vendor = new Vendor({
        userId: req.user.id,
        availableRolls: user.availableRolls || 0,
        totalRollsUsed: 0,
        totalShares: user.totalShares || 0,
      });
      await vendor.save();
      console.log("Auto-created vendor profile for user:", req.user.id);
    }

    const Shop = (await import("../models/Shop.js")).default;
    let approvedShop = await Shop.findOne({
      vendorId: req.user.id,
      isApproved: true,
    }).select("_id name logo isApproved");

    if (!approvedShop) {
      approvedShop = await Shop.findOne({
        vendorId: vendor._id,
        isApproved: true,
      }).select("_id name logo isApproved");

      if (approvedShop) {
        console.log("Found shop with vendor profile ID, fixing to user ID");
        await Shop.findByIdAndUpdate(approvedShop._id, {
          vendorId: req.user.id,
        });
        console.log("Fixed shop vendorId from", vendor._id, "to", req.user.id);
      }
    }

    console.log(
      "Shop lookup for user:",
      req.user.id,
      "Found shop:",
      approvedShop,
    );

    if (
      approvedShop &&
      (!vendor.shopId ||
        vendor.shopId.toString() !== approvedShop._id.toString())
    ) {
      vendor.shopId = approvedShop._id;
      await vendor.save();
      console.log(
        "Updated vendor profile with approved shop:",
        approvedShop._id,
      );
    }

    const recentPackages = await RollPackage.find({ vendor: vendor._id })
      .sort({ purchaseDate: -1 })
      .limit(5);

    const vendorData = {
      ...vendor.toObject(),
      availableRolls: user.availableRolls || 0, // Always use user's available rolls
      totalShares: user.totalShares || 0,
      shopId: approvedShop ? approvedShop._id : null,
      shop: approvedShop
        ? {
            id: approvedShop._id,
            name: approvedShop.name,
            logo: approvedShop.logo,
            isApproved: approvedShop.isApproved,
          }
        : null,
      recentPackages: recentPackages,
    };

    console.log("Returning vendor data:", {
      userId: vendorData.userId,
      shopId: vendorData.shopId,
      hasShop: !!vendorData.shop,
    });

    res.status(200).json({
      success: true,
      data: vendorData,
      message: "Vendor profile retrieved successfully",
    });
  } catch (error) {
    console.error("Get vendor profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving vendor profile",
    });
  }
};

// Get roll packages
export const getRollPackages = async (req, res) => {
  try {
    const packages = [
      {
        id: "25",
        rolls: 5,
        price: 25,
        bonus: 0,
        description: "Starter Package",
        popular: false,
      },
      {
        id: "50",
        rolls: 10,
        price: 50,
        bonus: 2,
        description: "Basic Package",
        popular: true,
      },
      {
        id: "100",
        rolls: 20,
        price: 100,
        bonus: 5,
        description: "Pro Package",
        popular: false,
      },
      {
        id: "500",
        rolls: 100,
        price: 500,
        bonus: 30,
        description: "Business Package",
        popular: false,
      },
    ];

    const vendor = await Vendor.findOne({ userId: req.user.id });
    const availableRolls = vendor ? vendor.availableRolls : 0;

    res.status(200).json({
      success: true,
      data: {
        packages: packages,
        currentAvailableRolls: availableRolls,
      },
      message: "Roll packages retrieved successfully",
    });
  } catch (error) {
    console.error("Get roll packages error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving packages",
    });
  }
};

// Purchase roll package
export const purchaseRollPackage = async (req, res) => {
  try {
    const { packageType } = req.body;
    const packages = {
      25: { rolls: 5, price: 25, bonus: 0 },
      50: { rolls: 10, price: 50, bonus: 2 },
      100: { rolls: 20, price: 100, bonus: 5 },
      500: { rolls: 100, price: 500, bonus: 30 },
    };

    const selectedPackage = packages[packageType];
    if (!selectedPackage) {
      return res.status(400).json({
        success: false,
        message: "Invalid package type",
      });
    }

    let vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      vendor = new Vendor({
        userId: req.user.id,
        availableRolls: 0,
        totalRollsUsed: 0,
      });
    }

    const totalRolls = selectedPackage.rolls + (selectedPackage.bonus || 0);
    vendor.availableRolls += totalRolls;

    // Create a record of the purchase
    const rollPackage = new RollPackage({
      vendor: vendor._id,
      packageType: packageType,
      price: selectedPackage.price,
      rollsIncluded: selectedPackage.rolls,
      bonusRolls: selectedPackage.bonus || 0,
      purchaseDate: new Date(),
      isActive: true,
    });

    await rollPackage.save();
    await vendor.save();

    res.status(200).json({
      success: true,
      data: {
        availableRolls: vendor.availableRolls,
        packagePurchased: {
          type: packageType,
          rolls: selectedPackage.rolls,
          bonus: selectedPackage.bonus || 0,
          total: totalRolls,
        },
      },
      message: "Package purchased successfully",
    });
  } catch (error) {
    console.error("Purchase roll package error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while purchasing package",
    });
  }
};

export const createShopRequest = async (req, res) => {
  try {
    console.log("Creating shop request for user:", req.user);

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    let logoUrl = req.body.logo;
    if (req.file) {
      try {
        const { v2: cloudinary } = await import("cloudinary");
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "shop_logos",
          resource_type: "image",
        });
        logoUrl = result.secure_url;

        // Clean up local file
        const fs = await import("fs");
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload logo",
        });
      }
    }

    const newRequest = new ShopRequest({
      ...req.body,
      logo: logoUrl,
      status: "pending",
      vendorId: req.user.id,
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: "Shop request created successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error("Create shop request error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

export const getVendorShopRequests = async (req, res) => {
  try {
    const requests = await ShopRequest.find({ vendorId: req.user.id })
      .populate("category", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: requests,
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
