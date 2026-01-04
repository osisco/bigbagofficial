import express from "express";
import { getLanguages } from "../controllers/languages.js";

const router = express.Router();

// Get all languages
router.get("/", getLanguages);

export default router;