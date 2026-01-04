import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const sanitizedName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9.-]/g, "_");
    const ext = path.extname(sanitizedName);
    cb(null, Date.now() + ext);
  },
});

const fileFilter = (req, file, cb) => {
  console.log("File received:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
  });

  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv/;

  // Check extension
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  // Check MIME type
  const mime =
    (file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")) &&
    allowedTypes.test(file.originalname.toLowerCase());

  console.log("File validation:", { ext, mime, allowed: ext && mime });

  if (ext && mime) {
    console.log("✅ File accepted by filter");
    cb(null, true);
  } else {
    console.log("❌ File rejected by filter");
    cb(new Error("Only image and video files are allowed"));
  }
};

// Multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB (increase for videos)
});

export default upload;
