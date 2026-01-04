import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";
import fs from "fs";

export const uploadFile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { folder = "uploads", resourceType } = req.body;

    // Determine resource type
    const isVideo = file.mimetype.startsWith("video/");
    const uploadResourceType = resourceType || (isVideo ? "video" : "image");

    console.log("Uploading file to Cloudinary:", file.path);
    console.log("File details:", {
      name: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      folder: folder,
      resourceType: uploadResourceType,
    });

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: uploadResourceType,
      folder: folder,
      quality: "auto",
    });

    console.log("Cloudinary upload successful:", result.secure_url);

    // Clean up local file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      console.log("Local file cleaned up:", file.path);
    }

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
      },
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "File upload failed: " + error.message,
    });
  }
};

// Upload image
export const uploadImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const { folder = "images" } = req.body;

    console.log("Uploading image to Cloudinary:", file.path);

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "image",
      folder: folder,
      quality: "auto",
    });

    console.log("Image upload successful:", result.secure_url);

    // Clean up local file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({
      success: false,
      message: "Image upload failed: " + error.message,
    });
  }
};

// Upload video
export const uploadVideo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No video uploaded",
      });
    }

    const { folder = "videos" } = req.body;

    console.log("Uploading video to Cloudinary:", file.path);

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "video",
      folder: folder,
      quality: "auto",
      format: "mp4",
    });

    console.log("Video upload successful:", result.secure_url);

    // Clean up local file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
      },
      message: "Video uploaded successfully",
    });
  } catch (error) {
    console.error("Video upload error:", error);
    res.status(500).json({
      success: false,
      message: "Video upload failed: " + error.message,
    });
  }
};
