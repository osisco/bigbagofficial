import express from "express";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * Health check endpoint
 * Returns server and database status
 */
router.get("/", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStates[dbStatus] || "unknown",
        readyState: dbStatus,
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        unit: "MB",
      },
      environment: process.env.NODE_ENV || "development",
    };

    // If database is not connected, return 503
    if (dbStatus !== 1) {
      health.status = "degraded";
      return res.status(503).json(health);
    }

    res.status(200).json(health);
  } catch (error) {
    logger.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
