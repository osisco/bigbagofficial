import express from "express";
import connectDB from "./connect.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import "./cloudinary.js";
import fs from "fs";
import path from "path";
import { API_CONFIG } from "./config/constants.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import managementRoutes from "./routes/management.js";
import couponRoutes from "./routes/coupon.js";
import offerRoutes from "./routes/offer.js";
import rollRoutes from "./routes/roll.js";
import vendorRoutes from "./routes/vendor.js";
import rollSaveRoutes from "./routes/save.js";
import categoryRoutes from "./routes/category.js";
import favoriteRoutes from "./routes/favorite.js";
import adRoutes from "./routes/ad.js";
import commentRoutes from "./routes/comment.js";
import shopRoutes from "./routes/shop.js";
import countriesRoutes from "./routes/countries.js";
import languagesRoutes from "./routes/languages.js";
import uploadRoutes from "./routes/upload.js";
import shareRoutes from "./routes/share.js";
import rollPackageRoutes from "./routes/rollPackage.js";
import { extractLocalization } from "./middleware/localization.js";
import { v2 as cloudinary } from "cloudinary";
import { verifyToken } from "./middleware/auth.js";
import upload from "./middleware/multer.js";

dotenv.config();

const app = express();

connectDB();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

// Middleware
app.use(express.json({ limit: API_CONFIG.UPLOAD_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: API_CONFIG.UPLOAD_LIMIT }));
app.use(cookieParser());
app.use(extractLocalization);

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With",
  );
  res.sendStatus(200);
});
// CORS setup
app.use(
  cors({
    origin: API_CONFIG.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
  }),
);
// Video upload endpoint
app.post(
  "/api/upload-video",
  verifyToken,
  upload.single("video"),
  async (req, res) => {
    try {
      console.log("Video upload endpoint hit");
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No video file provided" });
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video",
        folder: "rolls",
        quality: "auto",
        format: "mp4",
      });

     
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json({ success: true, videoUrl: result.secure_url });
    } catch (error) {
      console.error("Video upload error:", error);
      res.status(500).json({ success: false, message: "Video upload failed" });
    }
  },
);

app.post(
  "/api/test-formdata",
  verifyToken,
  upload.single("image"),
  (req, res) => {
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("File:", req.file);
    res.json({
      success: true,

      hasFile: !!req.file,
      bodyKeys: Object.keys(req.body),
    });
  },
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/management", managementRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/rolls", rollRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/save", rollSaveRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/favorite", favoriteRoutes);
app.use("/api/ads", adRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/countries", countriesRoutes);
app.use("/api/languages", languagesRoutes);
app.use("/api/roll-packages", rollPackageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/share", shareRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

const server = app.listen(API_CONFIG.PORT, "0.0.0.0", () => {
  console.log(`API is running on port ${API_CONFIG.PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    const newPort = API_CONFIG.PORT + 1;
    console.log(
      `Port ${API_CONFIG.PORT} is already in use. Trying port ${newPort}...`,
    );
    app.listen(newPort, "0.0.0.0", () => {
      console.log(`API is running on port ${newPort}`);
    });
  } else {
    console.error("Server error:", err);
  }
});
