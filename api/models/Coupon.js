import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      default: "",
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    discount: {
      type: String, // e.g. "20%" or "10 JOD"
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Coupon", CouponSchema);
