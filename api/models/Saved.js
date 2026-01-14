import mongoose from "mongoose";

const RollSaveSchema = new mongoose.Schema(
  {
    roll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roll",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Compound index for efficient lookups
RollSaveSchema.index({ user: 1, roll: 1 });
RollSaveSchema.index({ user: 1 });

export default mongoose.model("RollSave", RollSaveSchema);
