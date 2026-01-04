import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { rollsApi, handleApiError } from "../services/api";
import { ReelUpload } from "../types";

export const useRoll = () => {
  const { user, vendorProfile, isAuthenticated, isVendor } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadReel = useCallback(
    async (rollData: ReelUpload): Promise<boolean> => {
      if (!isAuthenticated || !user) {
        setUploadError("You must be signed in to upload rolls");
        return false;
      }

      if (!isVendor()) {
        setUploadError("You must be a vendor to upload rolls");
        return false;
      }

      if (!vendorProfile) {
        setUploadError(
          "Vendor profile not found. Please create a vendor profile first."
        );
        return false;
      }

      if (!vendorProfile.shopId) {
        setUploadError(
          "You must have an approved shop to upload rolls. Please create a shop request first."
        );
        return false;
      }

      if (vendorProfile.availableRolls <= 0) {
        setUploadError(
          "You have no available rolls. Please purchase a roll package to continue uploading."
        );
        return false;
      }

      try {
        setIsUploading(true);
        setUploadError(null);

        // Create FormData for file upload
        const formData = new FormData();
        const fixedUri = rollData.videoUri.startsWith("file://")
          ? rollData.videoUri
          : "file://" + rollData.videoUri;

        // Add video file
        if (rollData.videoUri) {
          formData.append("video", {
            uri: rollData.videoUri,
            type: "video/mp4",
            name: `reel_${Date.now()}.mp4`,
          } as any);
        } else {
          throw new Error("Video file is required");
        }

        // Add other fields
        const shopId = rollData.shopId;
        if (!shopId) {
          throw new Error("Shop ID is required");
        }
        formData.append("shop", shopId);
        formData.append("caption", rollData.caption || "");
        formData.append("category", rollData.category || "all");
        formData.append("duration", rollData.duration?.toString() || "30");

        // Upload to backend
        const response = await rollsApi.create(formData);

        if (response.success) {
          console.log("Roll uploaded successfully:", response.data);
          // The backend now returns remaining rolls count
          if (response.data?.remainingRolls !== undefined) {
            console.log("Remaining rolls:", response.data.remainingRolls);
          }
          return true;
        } else {
          setUploadError(response.message || "Failed to upload roll");
          return false;
        }
      } catch (error) {
        console.error("Error uploading roll:", error);
        const errorMessage = handleApiError(error);
        setUploadError(errorMessage);
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [user, vendorProfile, isAuthenticated, isVendor]
  );

  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  const checkReelAvailability = useCallback(() => {
    if (!vendorProfile)
      return { available: false, count: 0, error: "Vendor profile not found" };

    return {
      available: vendorProfile.availableRolls > 0,
      count: vendorProfile.availableRolls,
      error:
        vendorProfile.availableRolls <= 0
          ? "No rolls available. Please purchase a roll package."
          : null,
    };
  }, [vendorProfile]);

  return {
    uploadReel,
    isUploading,
    uploadError,
    uploadProgress,
    clearError,
    checkReelAvailability,
    availableRolls: vendorProfile?.availableRolls || 0,
    totalRollsUsed: vendorProfile?.totalRollsUsed || 0,
  };
};
