import mongoose from "mongoose";
import { API_CONFIG } from "../config/constants.js";

const UserSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: [
        API_CONFIG.ROLES.USER,
        API_CONFIG.ROLES.VENDOR,
        API_CONFIG.ROLES.ADMIN,
      ],
      required: true,
    },

    language: {
      type: String,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        default: [],
      },
    ],
    // Share-to-earn system (only for vendors and admins)
    availableRolls: {
      type: Number,
      default: function () {
        return API_CONFIG.ROLL_ALLOCATION[this.role.toUpperCase()] || 0;
      },
    },
    totalShares: { type: Number, default: 0 },
    lastShareDate: { type: Date, default: null },
    shareHistory: [
      {
        date: { type: Date, default: Date.now },
        deviceId: String,
        ipAddress: String,
        platform: String,
        verificationHash: String,
        verified: { type: Boolean, default: false },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

UserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

export default mongoose.model("User", UserSchema);
