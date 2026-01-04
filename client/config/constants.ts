// Client Configuration Constants
export const CLIENT_CONFIG = {
  // API Configuration
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "30000", 10),
  API_TIMEOUT_UPLOAD_MULTIPLIER: 4,
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: "auth_token",
    AUTH_STATE: "auth_state",
    USER_PREFERENCES: "user_preferences"
  },
  
  // API Base URL
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || "https://bigbag-api.fly.dev",
  
  // Headers
  HEADERS: {
    CONTENT_TYPE_JSON: "application/json",
    CONTENT_TYPE_MULTIPART: "multipart/form-data",
    NGROK_SKIP: "ngrok-skip-browser-warning"
  }
};

export default CLIENT_CONFIG;