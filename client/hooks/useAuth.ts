import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { AuthState, User, VendorProfile } from "../types";
import { authApi, userApi, vendorApi, handleApiError } from "../services/api";

const AUTH_STORAGE_KEY =
  process.env.EXPO_PUBLIC_AUTH_STORAGE_KEY || "auth_state";
const AUTH_TOKEN_KEY = process.env.EXPO_PUBLIC_AUTH_TOKEN_KEY || "auth_token";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    vendorProfile: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const loadAuth = async () => {
      try {
        console.log("Loading auth state from storage...");
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed: AuthState = JSON.parse(stored);
          console.log("Loaded auth state:", parsed);
          setAuthState({ ...parsed, isLoading: false });
        } else {
          console.log("No stored auth state found");
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (err) {
        console.error("Failed to load auth state", err);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    loadAuth();
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    if (!authState.isLoading) {
      console.log("Persisting auth state:", authState);
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState)).catch(
        (err) => console.error("Failed to persist auth state", err)
      );
    }
  }, [authState]);

  // Role helpers
  const isAdmin = useCallback((): boolean => {
    const result = authState.user?.role === "admin";
    console.log("isAdmin check:", {
      user: authState.user,
      role: authState.user?.role,
      result,
    });
    return result;
  }, [authState.user]);

  const isVendor = useCallback((): boolean => {
    const result = authState.user?.role === "vendor";
    console.log("isVendor check:", {
      user: authState.user,
      role: authState.user?.role,
      result,
    });
    return result;
  }, [authState.user]);

  const isUser = useCallback((): boolean => {
    const result = authState.user?.role === "user";
    console.log("isUser check:", {
      user: authState.user,
      role: authState.user?.role,
      result,
    });
    return result;
  }, [authState.user]);

  // Sign In (Login)
  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        console.log("Attempting sign in with email:", email);

        const response = await authApi.login(email, password);

        const payload =
          (response && response.data) || 
          response ||
          null;

        const token = payload?.token;
        const user = payload?.user;

        if (token && user) {
          try {
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
          } catch (e) {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
          }

          const newState: AuthState = {
            user,
            vendorProfile: payload?.vendorProfile || null,
            isAuthenticated: true,
            isLoading: false,
          };

          console.log("Sign in successful, new state:", newState);
          setAuthState(newState);
          return true;
        }

        console.log("Sign in failed: invalid response shape", response);
        return false;
      } catch (error) {
        console.error("Sign in error:", error);
        const errorMessage = handleApiError(error);
        console.error("Error message:", errorMessage);
        return false;
      }
    },
    []
  );

  const login = signIn;

  // Sign Up
  const signUp = useCallback(
    async (userData: {
      name: string;
      email: string;
      password: string;
      age: number;
      gender: "male" | "female";
      country: string;
      city: string;
      role: "user" | "vendor";
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log("Attempting sign up with data:", userData);

        const response = await authApi.signup(userData);

        const payload = (response && response.data) || response || null;
        const token = payload?.token;
        const user = payload?.user;

        if (token && user) {
          try {
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
          } catch (e) {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
          }

          const newState: AuthState = {
            user,
            vendorProfile: payload?.vendorProfile || null,
            isAuthenticated: true,
            isLoading: false,
          };

          console.log("Sign up successful, new state:", newState);
          setAuthState(newState);
          return { success: true };
        }

        console.log("Sign up failed: invalid response shape", response);
        return { success: false, error: "Failed to create account" };
      } catch (error) {
        console.error("Sign up error:", error);
        const errorMessage = handleApiError(error);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const signup = signUp;

  // Sign Out (Logout)
  const signOut = useCallback(async () => {
    try {
      console.log("Signing out user");


      try {
        await authApi.logout();
      } catch (apiError) {
        console.error("API logout error:", apiError);
      }

      const newState: AuthState = {
        user: null,
        vendorProfile: null,
        isAuthenticated: false,
        isLoading: false,
      };
      setAuthState(newState);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      try {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      } catch (e) {
        // ignore
      }
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      console.log("Sign out successful");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, []);

  const logout = signOut;

  // Refresh vendor profile
  const refreshVendorProfile = useCallback(async () => {
    if (!authState.user || authState.user.role !== "vendor") {
      return;
    }

    try {
      const response = await vendorApi.getProfile();
      if (response.success && response.data) {
        setAuthState((prev) => ({
          ...prev,
          vendorProfile: response.data,
        }));
      }
    } catch (error) {
      console.error("Error refreshing vendor profile:", error);
    }
  }, [authState.user]);

  // Refresh user profile
  const refreshUserProfile = useCallback(async () => {
    if (!authState.user) return;

    try {
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        setAuthState((prev) => ({
          ...prev,
          user: response.data,
        }));
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  }, [authState.user]);

  return {
    
    user: authState.user,
    vendorProfile: authState.vendorProfile,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    authState,

    signIn,
    signUp,
    signOut,
    login,
    signup,
    logout,

    isAdmin,
    isVendor,
    isUser,

    refreshVendorProfile,
    refreshUserProfile,
  };
}
