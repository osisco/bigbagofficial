import RollPackage from "../models/RollPackage.js";
import VendorProfile from "../models/Vendor.js";
import axios from "axios";

// Validate purchase receipt
export const purchaseRollPackage = async (req, res) => {
  const { platform, productId, receipt } = req.body;
  const vendorId = req.user.vendorProfileId; // assuming vendorProfileId stored in JWT

  if (!platform || !productId || !receipt) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  try {
    let isValid = false;
    let packageInfo = null;

    if (platform === "ios") {
      // Verify with Apple sandbox/production
      const appleEndpoint = "https://buy.itunes.apple.com/verifyReceipt";
      const response = await axios.post(appleEndpoint, {
        "receipt-data": receipt,
        password: process.env.APPLE_SHARED_SECRET,
      });
      if (response.data.status === 0) {
        isValid = true;
        const product_id = response.data.latest_receipt_info?.[0]?.product_id;
        packageInfo = mapProductIdToPackage(product_id);
      }
    } else if (platform === "android") {
      // Verify with Google Play
      const googleEndpoint = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${process.env.ANDROID_PACKAGE_NAME}/purchases/products/${productId}/tokens/${receipt}`;
      const googleResponse = await axios.get(googleEndpoint, {
        headers: {
          Authorization: `Bearer ${process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN}`,
        },
      });
      if (googleResponse.data.purchaseState === 0) {
        // purchased
        isValid = true;
        packageInfo = mapProductIdToPackage(productId);
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid platform" });
    }

    if (!isValid || !packageInfo) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid purchase" });
    }

    // Save RollPackage record
    const rollPackage = await RollPackage.create({
      vendor: vendorId,
      packageType: packageInfo.id,
      price: packageInfo.price,
      rollsIncluded: packageInfo.rolls,
      bonusRolls: packageInfo.bonus,
    });

    // Update vendor profile rolls count
    const vendor = await VendorProfile.findById(vendorId);
    if (vendor) {
      vendor.availableRolls += packageInfo.rolls + packageInfo.bonus;
      await vendor.save();
    }

    return res.json({ success: true, data: rollPackage });
  } catch (error) {
    console.error("Purchase error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const mapProductIdToPackage = (productId) => {
  switch (productId) {
    case "com.bigbag.rolls.25":
      return { id: "25", price: 25, rolls: 5, bonus: 0 };
    case "com.bigbag.rolls.50":
      return { id: "50", price: 50, rolls: 10, bonus: 2 };
    case "com.bigbag.rolls.100":
      return { id: "100", price: 100, rolls: 20, bonus: 5 };
    case "com.bigbag.rolls.500":
      return { id: "500", price: 500, rolls: 100, bonus: 30 };
    default:
      return null;
  }
};
