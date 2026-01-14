import mongoose from "mongoose";

const WeeklyShopShareSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    weekStart: {
      type: Date,
      required: true,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
WeeklyShopShareSchema.index({ country: 1, weekStart: -1, shareCount: -1 });
WeeklyShopShareSchema.index({ shopId: 1, country: 1, weekStart: 1 }, { unique: true });

export default mongoose.model("WeeklyShopShare", WeeklyShopShareSchema);