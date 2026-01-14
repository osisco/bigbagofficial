import express from "express";
import mongoose from "mongoose";
import connectDB from "./connect.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import compression from "compression";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import "./cloudinary.js";
import fs from "fs";
import path from "path";
import { API_CONFIG } from "./config/constants.js";
import {
  apiLimiter,
  authLimiter,
  uploadLimiter,
} from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/requestLogger.js";
import healthRoutes from "./routes/health.js";
import logger from "./utils/logger.js";

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
// Note: Console logging is enabled for debugging. Use a proper logging library in production.
// Consider using Winston, Pino, or similar with environment-based log levels.
console.log = () => {};
dotenv.config();

const app = express();

connectDB();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

// Security middleware (must be first)
if (process.env.NODE_ENV === "production") {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          connectSrc: ["'self'", "https:", "http:"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Cloudinary images
    }),
  );
}

// Compression middleware (reduce response size)
app.use(compression());

// Request logging (only in development or with debug flag)
if (
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_REQUEST_LOGGING === "true"
) {
  app.use(requestLogger);
}

// Body parsing middleware
app.use(express.json({ limit: API_CONFIG.UPLOAD_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: API_CONFIG.UPLOAD_LIMIT }));

// Data sanitization (prevent NoSQL injection)
app.use(mongoSanitize());

// Cookie parser
app.use(cookieParser());

// Localization middleware
app.use(extractLocalization);

// Rate limiting (apply to all routes)
app.use("/api/", apiLimiter);

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

// Health check route (before other routes, no rate limiting)
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

// Routes with specific rate limiters
app.use("/api/auth", authLimiter, authRoutes);
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
app.use("/api/upload", uploadLimiter, uploadRoutes);
app.use("/api/share", shareRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", {
    error: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Graceful shutdown handler
let isShuttingDown = false;
let shutdownTimeout = null;

const gracefulShutdown = (signal) => {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    logger.warn("Shutdown already in progress, ignoring signal:", signal);
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Clear any existing timeout
  if (shutdownTimeout) {
    clearTimeout(shutdownTimeout);
  }

  // Close HTTP server
  if (server && server.listening) {
    server.close(() => {
      logger.info("HTTP server closed.");

      // Close database connection safely
      // Mongoose v8+ close() returns a Promise, not a callback
      (async () => {
        try {
          // Check if mongoose is available and connection exists
          if (typeof mongoose !== "undefined" && mongoose.connection) {
            const connectionState = mongoose.connection.readyState;
            // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
            if (connectionState !== 0 && connectionState !== 3) {
              await mongoose.connection.close(false);
              logger.info("MongoDB connection closed.");
            } else {
              logger.info(
                "MongoDB connection already closed or disconnecting.",
              );
            }
          } else {
            logger.info("MongoDB connection not available.");
          }
        } catch (error) {
          logger.error("Error closing MongoDB connection:", error);
        } finally {
          // Exit after attempting to close database
          process.exit(0);
        }
      })();
    });

    // Force close after 10 seconds
    shutdownTimeout = setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  } else {
    logger.warn(
      "Server not initialized or not listening, exiting immediately.",
    );
    process.exit(0);
  }
};

const server = app.listen(API_CONFIG.PORT, "0.0.0.0", () => {
  logger.info(`API is running on port ${API_CONFIG.PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    const newPort = API_CONFIG.PORT + 1;
    logger.warn(
      `Port ${API_CONFIG.PORT} is already in use. Trying port ${newPort}...`,
    );
    app.listen(newPort, "0.0.0.0", () => {
      logger.info(`API is running on port ${newPort}`);
    });
  } else {
    logger.error("Server error:", err);
  }
});

// Handle graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  // Don't call gracefulShutdown for unhandled rejections during shutdown
  if (!isShuttingDown) {
    gracefulShutdown("unhandledRejection");
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  // Log the error but don't trigger another shutdown if already shutting down
  if (!isShuttingDown) {
    gracefulShutdown("uncaughtException");
  } else {
    // If we're already shutting down, just exit immediately to prevent loops
    logger.error("Uncaught exception during shutdown, exiting immediately");
    // Clear timeout if it exists
    if (shutdownTimeout) {
      clearTimeout(shutdownTimeout);
    }
    process.exit(1);
  }
});
