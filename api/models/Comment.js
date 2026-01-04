import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
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
    comment: {
      type: String,
      required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Comment", CommentSchema);
