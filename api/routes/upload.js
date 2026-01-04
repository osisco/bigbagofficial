import express from "express";
import { uploadFile, uploadImage, uploadVideo } from "../controllers/upload.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// Generic file upload
router.post("/file", verifyToken, upload.single("file"), uploadFile);

// Specific upload endpoints
router.post("/image", verifyToken, upload.single("image"), uploadImage);
router.post("/video", verifyToken, upload.single("video"), uploadVideo);

export default router;