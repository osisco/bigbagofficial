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

export default mongoose.model("RollSave", RollSaveSchema);
