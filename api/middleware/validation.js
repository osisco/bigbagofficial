import { API_CONFIG } from "../config/constants.js";

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page parameter. Must be a positive integer.",
      });
    }
    req.query.page = pageNum;
  }
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit parameter. Must be a positive integer.",
      });
    }
    if (limitNum > API_CONFIG.MAX_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Limit cannot exceed ${API_CONFIG.MAX_LIMIT}.`,
      });
    }
    req.query.limit = limitNum;
  }
  
  next();
};

/**
 * Validate cursor parameter for pagination
 */
export const validateCursor = (req, res, next) => {
  const { cursor } = req.query;
  
  if (cursor !== undefined && cursor !== null && cursor !== "") {
    const cursorDate = new Date(cursor);
    if (isNaN(cursorDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid cursor format. Must be a valid ISO date string.",
      });
    }
  }
  
  next();
};

/**
 * Validate roll creation input
 */
export const validateRollInput = (req, res, next) => {
  const { caption, category, duration, shop } = req.body;
  const errors = [];
  
  if (!shop || (typeof shop === "string" && shop.trim() === "")) {
    errors.push("Shop ID is required");
  }
  
  if (caption && typeof caption !== "string") {
    errors.push("Caption must be a string");
  }
  
  if (category && typeof category !== "string") {
    errors.push("Category must be a string");
  }
  
  if (duration !== undefined) {
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 300) {
      errors.push("Duration must be a number between 1 and 300 seconds");
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }
  
  next();
};
