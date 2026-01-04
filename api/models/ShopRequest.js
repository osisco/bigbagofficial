import mongoose from "mongoose";

const ShopRequestSchema = new mongoose.Schema({

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: "en",
  },
  description: {
    type: String,
    default: "",
  },
  link: {
    type: String,
    default: "",
  },
  supportedCountries: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ["approved", "declined", "pending"],
    default: "pending",
    required: true,
  },
});

export default mongoose.model("ShopRequest", ShopRequestSchema);
