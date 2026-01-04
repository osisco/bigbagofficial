import mongoose from "mongoose";

const RollPackageSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VendorProfile",
    required: true,
  },
  packageType: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  rollsIncluded: {
    type: Number,
    required: true,
  },
  bonusRolls: {
    type: Number,
    default: 0,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.model("RollPackage", RollPackageSchema);
