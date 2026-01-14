// API Configuration Constants
export const API_CONFIG = {
  // Server Configuration
  PORT: Number(process.env.PORT) || 5050,
  UPLOAD_LIMIT: process.env.UPLOAD_LIMIT || "50mb",
  CORS_ORIGIN: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : "*"),
  
  // Database Limits
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  
  // Cloudinary Folders
  FOLDERS: {
    COUPONS: "coupons",
    OFFERS: "offers", 
    ROLLS: "rolls",
    SHOPS: "shops",
    ADS: "ads"
  },
  
  // User Roles
  ROLES: {
    USER: "user",
    VENDOR: "vendor", 
    ADMIN: "admin"
  },
  
  // Roll Allocation
  ROLL_ALLOCATION: {
    USER: 0,
    VENDOR: 1,
    ADMIN: 1
  },
  
  // Share System
  SHARE_COOLDOWN_HOURS: 24,
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  }
};

// Client Configuration Constants
export const CLIENT_CONFIG = {
  // API Configuration
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "30000", 10),
  API_TIMEOUT_UPLOAD: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "30000", 10) * 4,
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: "auth_token",
    AUTH_STATE: "auth_state",
    USER_PREFERENCES: "user_preferences"
  }
};

export default { API_CONFIG, CLIENT_CONFIG };