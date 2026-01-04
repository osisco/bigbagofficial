import express from "express";
import { getCountries } from "../controllers/countries.js";

const router = express.Router();

// Get all countries
router.get("/", getCountries);

export default router;