import mongoose from "mongoose";

const RollSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    videoUrl: { type: String, required: true },
    caption: { type: String },
    category: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    duration: { type: Number },
  },
  { timestamps: true },
);
// by osama, could it be better ?
RollSchema.index({ createdAt: -1 });
RollSchema.index({ shop: 1 });
RollSchema.index({ category: 1 });
RollSchema.index({ createdBy: 1 });
RollSchema.index({ createdAt: -1, category: 1 });

export default mongoose.model("Roll", RollSchema);
