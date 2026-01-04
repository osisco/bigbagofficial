import express from "express";
import { 
  createComment, 
  getCommentsByReel, 
  likeComment, 
  unlikeComment, 
  updateComment, 
  deleteComment 
} from "../controllers/comment.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Create a new comment
router.post("/", verifyToken, createComment);
router.post("/createComment", verifyToken, createComment);

// Get comments for a specific roll
router.get("/roll/:rollId", getCommentsByReel);
router.get("/getComments/:rollId", getCommentsByReel);

// Update a comment
router.put("/:commentId", verifyToken, updateComment);

// Delete a comment
router.delete("/:commentId", verifyToken, deleteComment);

// Like/unlike a comment
router.post("/:commentId/like", verifyToken, likeComment);
router.delete("/:commentId/like", verifyToken, unlikeComment);

export default router;
