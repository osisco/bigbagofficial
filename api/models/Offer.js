import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    discount: {
      type: String, 
      required: true,
    },
    originalPrice: {
      type: String, 
      required: true,
    },
    salePrice: {
      type: String, 
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isLimited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Offer", OfferSchema);
