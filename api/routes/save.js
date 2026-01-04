// backend/routes/reelSaveRoutes.js
import express from "express";
import mongoose from "mongoose";
import Roll from "../models/Roll.js";
import Saved from "../models/Saved.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get all saved rolls for a user
router.get("/rolls", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const saves = await Saved.find({ user: userId })
      .populate({
        path: 'roll',
        populate: {
          path: 'shop',
          select: 'name logo'
        }
      });
    
    const savedReels = saves.map(save => {
      const roll = save.roll;
      return {
        id: roll._id,
        shopId: roll.shop._id,
        shopName: roll.shop.name,
        shopLogo: roll.shop.logo,
        videoUrl: roll.videoUrl,
        caption: roll.caption,
        category: roll.category,
        likes: roll.likesCount || 0,
        comments: [],
        saves: roll.savesCount || 0,
        shares: roll.sharesCount || 0,
        createdBy: roll.createdBy,
        createdAt: roll.createdAt,
        isLiked: roll.likes?.includes(userId) || false,
        isSaved: true,
        duration: roll.duration || 30
      };
    });
    
    res.json({
      success: true,
      data: savedReels,
      message: "Saved rolls retrieved successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch saved rolls", 
      error: error.message 
    });
  }
});

// Save a roll
router.post("/rolls/:rollId", verifyToken, async (req, res) => {
  try {
    const { rollId } = req.params;
    const userId = req.user.id;

    const existingSave = await Saved.findOne({ roll: rollId, user: userId });
    if (existingSave) {
      return res.status(400).json({ 
        success: false,
        message: "Roll already saved" 
      });
    }

    const newSave = await Saved.create({ roll: rollId, user: userId });
    const roll = await Roll.findByIdAndUpdate(
      rollId, 
      { $inc: { savesCount: 1 } },
      { new: true }
    );

    res.status(201).json({ 
      success: true,
      data: {
        isSaved: true,
        savesCount: roll.savesCount
      },
      message: "Roll saved successfully" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Failed to save roll", 
      error: error.message 
    });
  }
});

// Unsave a roll
router.delete("/rolls/:rollId", verifyToken, async (req, res) => {
  try {
    const { rollId } = req.params;
    const userId = req.user.id;

    const deleted = await Saved.findOneAndDelete({
      roll: rollId,
      user: userId,
    });
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: "Roll not saved yet" 
      });
    }

    const roll = await Roll.findByIdAndUpdate(
      rollId, 
      { $inc: { savesCount: -1 } },
      { new: true }
    );
    
    res.json({ 
      success: true,
      data: {
        isSaved: false,
        savesCount: Math.max(0, roll.savesCount)
      },
      message: "Roll unsaved successfully" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Failed to unsave roll", 
      error: error.message 
    });
  }
});

export default router;