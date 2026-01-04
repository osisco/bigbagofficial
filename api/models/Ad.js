import mongoose from "mongoose";

const AdSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    linkType: {
      type: String,
      enum: ['internal', 'external'],
      default: 'internal',
    },
    linkUrl: {
      type: String,
      default: null,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Ad", AdSchema);
