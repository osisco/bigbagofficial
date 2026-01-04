import mongoose from "mongoose";

const VendorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    default: null,
  },
  rollPackages: [{ type: mongoose.Schema.Types.ObjectId, ref: "RollPackage" }],
  availableRolls: { type: Number, default: 0 },
  totalRollsUsed: { type: Number, default: 0 },
});

export default mongoose.model("VendorProfile", VendorProfileSchema);
