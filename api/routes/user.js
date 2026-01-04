import express from "express";
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
} from "../controllers/user.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, getUsers); // only admin can list all users
router.get("/profile", verifyToken, getProfile); // get current user profile
router.put("/profile", verifyToken, updateProfile); // update current user profile
router.get("/:id", verifyToken, getUser); // logged-in users can get a single user
router.put("/:id", verifyToken, updateUser); // logged-in users can update
router.delete("/:id", verifyToken, isAdmin, deleteUser); // only admin can delete

export default router;
