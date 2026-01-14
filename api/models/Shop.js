import mongoose from "mongoose";

const ShopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    supportedCountries: [
      {
        type: String,
      },
    ],
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    location: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "en",
    },
    shareCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Indexes for efficient queries
ShopSchema.index({ vendorId: 1 });
ShopSchema.index({ isApproved: 1 });
ShopSchema.index({ country: 1 });
ShopSchema.index({ category: 1 });
ShopSchema.index({ vendorId: 1, isApproved: 1 });

export default mongoose.model("Shop", ShopSchema);
