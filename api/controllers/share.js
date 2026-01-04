import User from "../models/User.js";
import crypto from "crypto";

export const recordShare = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId, platform } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Regular users cannot earn rolls through sharing",
      });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentShares = user.shareHistory.filter(
      (share) =>
        share.date > oneDayAgo &&
        (share.deviceId === deviceId || share.ipAddress === ipAddress),
    );

    if (recentShares.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You can only earn rolls once per day per device",
        nextShareAvailable: new Date(
          recentShares[0].date.getTime() + 24 * 60 * 60 * 1000,
        ),
      });
    }

    const verificationHash = crypto
      .createHash("sha256")
      .update(`${userId}-${deviceId}-${platform}-${now.getTime()}`)
      .digest("hex");

    user.shareHistory.push({
      date: now,
      deviceId,
      ipAddress,
      verified: true,
      platform,
      verificationHash,
    });

    // Reward user with 1 roll
    user.availableRolls += 1;
    user.totalShares += 1;
    user.lastShareDate = now;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Share recorded successfully! You earned 1 roll.",
      data: {
        availableRolls: user.availableRolls,
        totalShares: user.totalShares,
        reelsEarned: 1,
      },
    });
  } catch (error) {
    console.error("Share recording error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record share",
    });
  }
};

export const getShareStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "availableRolls totalShares lastShareDate shareHistory",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const canShareToday = !user.shareHistory.some(
      (share) => share.date > oneDayAgo,
    );

    res.status(200).json({
      success: true,
      data: {
        availableRolls: user.availableRolls,
        totalShares: user.totalShares,
        lastShareDate: user.lastShareDate,
        canShareToday,
        nextShareAvailable: canShareToday
          ? null
          : new Date(user.lastShareDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    console.error("Get share stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get share statistics",
    });
  }
};
