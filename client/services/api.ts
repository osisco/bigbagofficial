import axios, { AxiosInstance, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import CLIENT_CONFIG from "../config/constants";

// API Configuration from environment variables
const API_BASE_URL = CLIENT_CONFIG.API_BASE_URL;
const API_TIMEOUT = CLIENT_CONFIG.API_TIMEOUT;

console.log("API Configuration:", {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

// Create axios instance for JSON requests
const jsonClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": CLIENT_CONFIG.HEADERS.CONTENT_TYPE_JSON,
    [CLIENT_CONFIG.HEADERS.NGROK_SKIP]: "true",
  },
});

// Create axios instance for file uploads
const uploadClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT * CLIENT_CONFIG.API_TIMEOUT_UPLOAD_MULTIPLIER,
  headers: {
    [CLIENT_CONFIG.HEADERS.NGROK_SKIP]: "true",
  },
});

// Use jsonClient as default
const apiClient = jsonClient;

// Request interceptor for JSON client
jsonClient.interceptors.request.use(
  async (config) => {
    try {
      const token =
        (await SecureStore.getItemAsync(CLIENT_CONFIG.STORAGE_KEYS.AUTH_TOKEN)) ||
        (await AsyncStorage.getItem(CLIENT_CONFIG.STORAGE_KEYS.AUTH_TOKEN));
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log("JSON API Request:", {
        method: config.method,
        url: config.url,
      });
    } catch (error) {
      console.error("Error in JSON request interceptor:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Request interceptor for upload client
uploadClient.interceptors.request.use(
  async (config) => {
    try {
      const token =
        (await SecureStore.getItemAsync(CLIENT_CONFIG.STORAGE_KEYS.AUTH_TOKEN)) ||
        (await AsyncStorage.getItem(CLIENT_CONFIG.STORAGE_KEYS.AUTH_TOKEN));
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Force multipart/form-data for FormData
      if (config.data instanceof FormData) {
        config.headers["Content-Type"] = CLIENT_CONFIG.HEADERS.CONTENT_TYPE_MULTIPART;
      }

      console.log("Upload API Request:", {
        method: config.method,
        url: config.url,
        isFormData: config.data instanceof FormData,
        contentType: config.headers["Content-Type"],
      });
    } catch (error) {
      console.error("Error in upload request interceptor:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptors for both clients
const responseInterceptor = {
  success: (response: any) => {
    console.log("API Response:", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  error: async (error: AxiosError) => {
    console.error("API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
      headers: error.config?.headers,
    });

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(CLIENT_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(CLIENT_CONFIG.STORAGE_KEYS.AUTH_STATE);
    }
    return Promise.reject(error);
  },
};

jsonClient.interceptors.response.use(
  responseInterceptor.success,
  responseInterceptor.error
);
uploadClient.interceptors.response.use(
  responseInterceptor.success,
  responseInterceptor.error
);

// API Error Handler
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      return (
        error.response.data?.message ||
        error.response.data?.error ||
        "Server error occurred"
      );
    } else if (error.request) {
      // Request made but no response
      return "Network error. Please check your connection.";
    }
  }
  return error.message || "An unexpected error occurred";
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post("/api/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  signup: async (userData: {
    name: string;
    email: string;
    password: string;
    age: number;
    gender: "male" | "female";
    country: string;
    city: string;
    role: "user" | "vendor";
  }) => {
    const response = await apiClient.post("/api/auth/signup", userData);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post("/api/auth/logout");
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post("/api/auth/refresh");
    return response.data;
  },
};

// User API
export const userApi = {
  getProfile: async () => {
    const response = await apiClient.get("/api/user/profile");
    return response.data;
  },

  updateProfile: async (updates: any) => {
    const response = await apiClient.put("/api/user/profile", updates);
    return response.data;
  },

  getById: async (userId: string) => {
    const response = await apiClient.get(`/api/user/${userId}`);
    return response.data;
  },
};

// Management API (Admin)
export const managementApi = {
  getShopRequests: async () => {
    const response = await apiClient.get("/api/management/shop-requests");
    return response.data;
  },

  approveShopRequest: async (requestId: string) => {
    const response = await apiClient.post(
      `/api/management/shop-requests/${requestId}/approve`
    );
    return response.data;
  },

  rejectShopRequest: async (requestId: string, reason: string) => {
    const response = await apiClient.post(
      `/api/management/shop-requests/${requestId}/reject`,
      { reason }
    );
    return response.data;
  },
};

// Coupons API
export const couponsApi = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get("/api/coupons", { params });
    return response.data;
  },

  getById: async (couponId: string) => {
    const response = await apiClient.get(`/api/coupons/${couponId}`);
    return response.data;
  },

  create: async (coupon: any) => {
    const client = coupon instanceof FormData ? uploadClient : jsonClient;
    const response = await client.post("/api/coupons", coupon);
    return response.data;
  },

  update: async (couponId: string, updates: any) => {
    const response = await apiClient.put(`/api/coupons/${couponId}`, updates);
    return response.data;
  },

  delete: async (couponId: string) => {
    const response = await apiClient.delete(`/api/coupons/${couponId}`);
    return response.data;
  },
};

// Offers API
export const offersApi = {
  getAll: async () => {
    const response = await apiClient.get("/api/offers");
    return response.data;
  },

  getById: async (offerId: string) => {
    const response = await apiClient.get(`/api/offers/${offerId}`);
    return response.data;
  },

  getByShop: async (shopId: string) => {
    const response = await apiClient.get(`/api/offers/shop/${shopId}`);
    return response.data;
  },

  create: async (offer: any) => {
    const client = offer instanceof FormData ? uploadClient : jsonClient;
    const response = await client.post("/api/offers", offer);
    return response.data;
  },

  update: async (offerId: string, updates: any) => {
    const client = updates instanceof FormData ? uploadClient : jsonClient;
    const response = await client.put(`/api/offers/${offerId}`, updates);
    return response.data;
  },

  delete: async (offerId: string) => {
    const response = await apiClient.delete(`/api/offers/${offerId}`);
    return response.data;
  },
};

// Rolls API
export const rollsApi = {
  getAll: async (params?: { category?: string; page?: number; limit?: number; shopId?: string }) => {
    // If shopId is provided, use the shop-specific endpoint
    if (params?.shopId) {
      const response = await apiClient.get(`/api/rolls/shop/${params.shopId}`);
      return response.data;
    }
    
    const response = await apiClient.get("/api/rolls", { params });
    return response.data;
  },

  getById: async (rollId: string) => {
    const response = await apiClient.get(`/api/rolls/${rollId}`);
    return response.data;
  },

  getByShop: async (shopId: string) => {
    const response = await apiClient.get(`/api/rolls/shop/${shopId}`);
    return response.data;
  },

  create: async (rollData: FormData) => {
    const response = await uploadClient.post("/api/rolls", rollData);
    return response.data;
  },

  update: async (rollId: string, updates: any) => {
    const response = await apiClient.put(`/api/rolls/${rollId}`, updates);
    return response.data;
  },

  delete: async (rollId: string) => {
    const response = await apiClient.delete(`/api/rolls/${rollId}`);
    return response.data;
  },

  like: async (rollId: string) => {
    const response = await apiClient.post(`/api/rolls/${rollId}/like`);
    return response.data;
  },

  unlike: async (rollId: string) => {
    const response = await apiClient.delete(`/api/rolls/${rollId}/like`);
    return response.data;
  },

  share: async (rollId: string) => {
    const response = await apiClient.post(`/api/rolls/${rollId}/share`);
    return response.data;
  },

  save: async (rollId: string) => {
    const response = await apiClient.post(`/api/save/rolls/${rollId}`);
    return response.data;
  },

  unsave: async (rollId: string) => {
    const response = await apiClient.delete(`/api/save/rolls/${rollId}`);
    return response.data;
  },
};

// Vendor API
export const vendorApi = {
  getProfile: async () => {
    const response = await apiClient.get("/api/vendor/profile");
    return response.data;
  },

  getRollPackages: async () => {
    const response = await apiClient.get("/api/vendor/roll-packages");
    return response.data;
  },

  purchaseRollPackage: async (packageType: string) => {
    const response = await apiClient.post(
      "/api/vendor/roll-packages/purchase",
      { packageType }
    );
    return response.data;
  },

  createShopRequest: async (shopData: any) => {
    const client = shopData instanceof FormData ? uploadClient : jsonClient;
    const response = await client.post("/api/vendor/shop-request", shopData);
    return response.data;
  },

  getShopRequests: async () => {
    const response = await apiClient.get("/api/vendor/shop-requests");
    return response.data;
  },
};

// Save API
export const saveApi = {
  getSavedRolls: async () => {
    const response = await apiClient.get("/api/save/rolls");
    return response.data;
  },

  saveRoll: async (rollId: string) => {
    const response = await apiClient.post(`/api/save/rolls/${rollId}`);
    return response.data;
  },

  unsaveRoll: async (rollId: string) => {
    const response = await apiClient.delete(`/api/save/rolls/${rollId}`);
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async () => {
    const response = await apiClient.get("/api/categories");
    return response.data;
  },

  getById: async (categoryId: string) => {
    const response = await apiClient.get(`/api/categories/${categoryId}`);
    return response.data;
  },

  create: async (categoryData: any) => {
    const response = await apiClient.post("/api/categories", categoryData);
    return response.data;
  },

  update: async (categoryId: string, updates: any) => {
    const response = await apiClient.put(
      `/api/categories/${categoryId}`,
      updates
    );
    return response.data;
  },

  delete: async (categoryId: string) => {
    const response = await apiClient.delete(`/api/categories/${categoryId}`);
    return response.data;
  },
};

// Shops API
export const shopsApi = {
  getAll: async (params?: { category?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get("/api/shops", { params });
    return response.data;
  },

  getById: async (shopId: string) => {
    const response = await apiClient.get(`/api/shops/${shopId}`);
    return response.data;
  },

  create: async (shopData: any) => {
    const client = shopData instanceof FormData ? uploadClient : jsonClient;
    const response = await client.post("/api/shops", shopData);
    return response.data;
  },

  adminCreate: async (shopData: any) => {
    const client = shopData instanceof FormData ? uploadClient : jsonClient;
    const response = await client.post("/api/shops/admin/create", shopData);
    return response.data;
  },

  update: async (shopId: string, updates: any) => {
    const client = updates instanceof FormData ? uploadClient : jsonClient;
    const response = await client.put(`/api/shops/${shopId}`, updates);
    return response.data;
  },

  delete: async (shopId: string) => {
    const response = await apiClient.delete(`/api/shops/${shopId}`);
    return response.data;
  },

  getReviews: async (shopId: string) => {
    const response = await apiClient.get(`/api/shops/${shopId}/reviews`);
    return response.data;
  },

  submitReview: async (
    shopId: string,
    reviewData: { rating: number; comment: string }
  ) => {
    const response = await apiClient.post(
      `/api/shops/${shopId}/reviews`,
      reviewData
    );
    return response.data;
  },
};

// Favorite API
export const favoriteApi = {
  getFavoriteShops: async () => {
    const response = await apiClient.get("/api/favorite/getFavorites");
    return response.data;
  },

  addFavoriteShop: async (shopId: string) => {
    const response = await apiClient.post("/api/favorite/toggleFavorites", {
      shopId,
    });
    return response.data;
  },

  removeFavoriteShop: async (shopId: string) => {
    const response = await apiClient.post("/api/favorite/toggleFavorites", {
      shopId,
    });
    return response.data;
  },
};

// Ads API
export const adsApi = {
  getActive: async () => {
    const response = await apiClient.get("/api/ads/active");
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get("/api/ads");
    return response.data;
  },

  create: async (adData: any) => {
    const client = adData instanceof FormData ? uploadClient : jsonClient;
    const response = await client.post("/api/ads", adData);
    return response.data;
  },

  update: async (adId: string, updates: any) => {
    const client = updates instanceof FormData ? uploadClient : jsonClient;
    const response = await client.put(`/api/ads/${adId}`, updates);
    return response.data;
  },

  delete: async (adId: string) => {
    const response = await apiClient.delete(`/api/ads/${adId}`);
    return response.data;
  },
};

// Comments API
export const commentsApi = {
  getByRoll: async (rollId: string) => {
    const response = await apiClient.get(`/api/comments/roll/${rollId}`);
    return response.data;
  },

  create: async (rollId: string, comment: string) => {
    const response = await apiClient.post("/api/comments", { rollId, comment });
    return response.data;
  },

  update: async (commentId: string, comment: string) => {
    const response = await apiClient.put(`/api/comments/${commentId}`, {
      comment,
    });
    return response.data;
  },

  delete: async (commentId: string) => {
    const response = await apiClient.delete(`/api/comments/${commentId}`);
    return response.data;
  },

  like: async (commentId: string) => {
    const response = await apiClient.post(`/api/comments/${commentId}/like`);
    return response.data;
  },

  unlike: async (commentId: string) => {
    const response = await apiClient.delete(`/api/comments/${commentId}/like`);
    return response.data;
  },
};

// Countries API
export const countriesApi = {
  getAll: async () => {
    const response = await apiClient.get("/api/countries");
    return response.data;
  },
};

// Languages API
export const languagesApi = {
  getAll: async () => {
    const response = await apiClient.get("/api/languages");
    return response.data;
  },
};

// Upload API
export const uploadApi = {
  uploadFile: async (file: File, folder?: string, resourceType?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) formData.append("folder", folder);
    if (resourceType) formData.append("resourceType", resourceType);

    const response = await uploadClient.post("/api/upload/file", formData);
    return response.data;
  },

  uploadImage: async (image: File, folder?: string) => {
    const formData = new FormData();
    formData.append("image", image);
    if (folder) formData.append("folder", folder);

    const response = await uploadClient.post("/api/upload/image", formData);
    return response.data;
  },

  uploadVideo: async (video: File, folder?: string) => {
    const formData = new FormData();
    formData.append("video", video);
    if (folder) formData.append("folder", folder);

    const response = await uploadClient.post("/api/upload/video", formData);
    return response.data;
  },
};

// Test API
export const testApi = {
  testFormData: async (imageUri: string) => {
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      type: "image/jpeg",
      name: "test.jpg",
    } as any);
    formData.append("title", "Test Upload");

    console.log("Testing FormData:", formData);
    const response = await uploadClient.post("/api/test-formdata", formData);
    return response.data;
  },
};

// Share API
export const shareApi = {
  recordShare: async (deviceId: string, platform: string) => {
    const response = await apiClient.post("/api/share/record", {
      deviceId,
      platform,
    });
    return response.data;
  },

  getShareStats: async () => {
    const response = await apiClient.get("/api/share/stats");
    return response.data;
  },
};

export default apiClient;
