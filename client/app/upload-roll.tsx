import * as ImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  useColors,
  useCommonStyles,
  spacing,
  typography,
  borderRadius,
} from "../styles/commonStyles";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { useRoll } from "../hooks/useRoll";
import { vendorApi, rollsApi, handleApiError } from "../services/api";
import apiClient from "../services/api";
import {
  checkRollConsumptionStatus,
  formatRollCount,
} from "../utils/rollConsumption";


const categories = [
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "kids", label: "Kids" },
  { id: "all", label: "All" },
];

export default function UploadReelScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const [videoUri, setVideoUri] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "men" | "women" | "kids" | "all"
  >("all");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVendorProfile, setCurrentVendorProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.sm,
    },
    title: {
      ...typography.h2,
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    reelBalance: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    },
    reelBalanceLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reelBalanceText: {
      ...typography.body,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    reelBalanceCount: {
      ...typography.bodyBold,
      marginLeft: spacing.xs,
    },
    buyPackageButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    buyPackageButtonText: {
      ...typography.bodyBold,
      color: colors.white,
    },
    noShopWarning: {
      backgroundColor: colors.accent + '20',
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    },
    noShopWarningText: {
      ...typography.body,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    createShopButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      alignSelf: 'flex-start',
    },
    createShopButtonText: {
      ...typography.bodyBold,
      color: colors.white,
    },
    videoContainer: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      marginBottom: spacing.md,
      aspectRatio: 9/16,
      position: 'relative',
    },
    video: {
      flex: 1,
    },
    videoPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoInfo: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    videoInfoText: {
      ...typography.caption,
      color: colors.white,
      marginRight: spacing.sm,
    },
    selectVideoButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    selectVideoButtonText: {
      ...typography.bodyBold,
      color: colors.white,
      marginLeft: spacing.sm,
    },
    inputContainer: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.bodyBold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    textInput: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      ...typography.body,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    categoryOption: {
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryOptionText: {
      ...typography.body,
      color: colors.text,
    },
    uploadButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    uploadButtonDisabled: {
      backgroundColor: colors.border,
    },
    uploadButtonText: {
      ...typography.bodyBold,
      color: colors.white,
    },
  });

  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = false;
    player.muted = true;
  });

  const { user, vendorProfile, isVendor, refreshVendorProfile, refreshUserProfile } = useAuth();
  const {
    uploadReel,
    isUploading,
    uploadError,
    availableRolls: hookAvailableReels,
    checkReelAvailability,
  } = useRoll();

  // Use fresh data first, fallback to cached
  const availableRolls =
    currentVendorProfile?.availableRolls ?? vendorProfile?.availableRolls ?? 0;
  const hasShop = Boolean(
    currentVendorProfile?.shopId || vendorProfile?.shopId
  );
  const consumptionStatus = checkRollConsumptionStatus(
    currentVendorProfile || vendorProfile
  );
  const isUploadDisabled =
    !videoUri ||
    !caption.trim() ||
    !consumptionStatus.canUpload ||
    isLoading ||
    isUploading;

  useEffect(() => {
    loadVendorProfile();
  }, []); // Remove the dependencies that cause infinite loop

  const loadVendorProfile = async () => {
    if (!user || !isVendor()) {
      setIsLoadingProfile(false);
      return;
    }

    try {
      const response = await vendorApi.getProfile();
      if (response.success && response.data) {
        setCurrentVendorProfile(response.data);
      }
    } catch (error) {
      console.error("Error loading vendor profile:", handleApiError(error));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const selectVideo = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your media library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setVideoDuration(result.assets[0].duration || 0);
      }
    } catch (error) {
      console.error("Error selecting video:", error);
      Alert.alert("Error", "Failed to select video");
    }
  };

  const handleUpload = async () => {
    if (!user || !isVendor()) {
      Alert.alert("Error", "Only vendors can upload rolls");
      return;
    }

    if (!hasShop) {
      Alert.alert("Error", "You need to create a shop before uploading rolls");
      return;
    }

    if (!videoUri) {
      Alert.alert("Error", "Please select a video");
      return;
    }

    if (!caption.trim()) {
      Alert.alert("Error", "Please add a caption");
      return;
    }

    if (!consumptionStatus.canUpload) {
      Alert.alert(
        "Cannot Upload Roll",
        consumptionStatus.message || "Unable to upload roll at this time.",
        [
          { text: "Cancel", style: "cancel" },
          ...(consumptionStatus.requiresPackagePurchase
            ? [
                {
                  text: "Buy Package",
                  onPress: () => router.push("/vendor/roll-packages"),
                },
              ]
            : []),
        ]
      );
      return;
    }

    setIsLoading(true);

    try {
      // Upload real video file with FormData
      console.log("Uploading real video file...");
      const uploadResult = await uploadReel({
        videoUri,
        caption: caption.trim(),
        category: selectedCategory,
        shopId:
          currentVendorProfile?.shopId?._id || currentVendorProfile?.shopId,
        duration: Math.floor(videoDuration / 1000),
      });

      if (uploadResult) {
        await loadVendorProfile();
        await refreshVendorProfile();
        await refreshUserProfile(); // Refresh user profile to update available rolls
        Alert.alert("Success", "Your roll has been uploaded successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", uploadError || "Failed to upload roll");
      }
    } catch (error) {
      console.error("Error uploading roll:", error);
      Alert.alert(
        "Error",
        uploadError || handleApiError(error) || "Failed to upload roll"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBuyPackage = () => {
    router.push("/vendor/roll-packages");
  };

  const handleCreateShop = () => {
    router.push("/vendor/create-shop");
  };

  if (!user || !isVendor()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Upload Roll</Text>
        </View>
        <View
          style={[
            styles.content,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={typography.body}>Only vendors can upload rolls</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Upload Roll</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Roll Balance */}
        <View style={styles.reelBalance}>
          <View style={styles.reelBalanceLeft}>
            <Ionicons
              name="videocam"
              size={24}
              color={availableRolls > 0 ? colors.primary : colors.error}
            />
            <Text style={styles.reelBalanceText}>Available Rolls:</Text>
            <Text
              style={[
                styles.reelBalanceCount,
                {
                  color: availableRolls > 0 ? colors.primary : colors.error,
                },
              ]}
            >
              {isLoadingProfile ? "..." : formatRollCount(availableRolls)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.buyPackageButton}
            onPress={handleBuyPackage}
          >
            <Text style={styles.buyPackageButtonText}>
              {availableRolls <= 0 ? "Buy Package" : "Buy More"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Shop Warning */}
        {!hasShop && (
          <View style={styles.noShopWarning}>
            <Text style={styles.noShopWarningText}>
              You need to create a shop before you can upload rolls. Your shop
              request will be reviewed by our admin team.
            </Text>
            <TouchableOpacity
              style={styles.createShopButton}
              onPress={handleCreateShop}
            >
              <Text style={styles.createShopButtonText}>Create Shop</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Video Preview */}
        <View style={styles.videoContainer}>
          {videoUri ? (
            <>
              <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                showsTimecodes={true}
                requiresLinearPlayback={false}
              />
              <View style={styles.videoInfo}>
                <Text style={styles.videoInfoText}>
                  Duration: {formatDuration(videoDuration / 1000)}
                </Text>
                <TouchableOpacity onPress={() => setVideoUri("")}>
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons
                name="videocam-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginTop: spacing.sm },
                ]}
              >
                No video selected
              </Text>
            </View>
          )}
        </View>

        {/* Select Video Button */}
        <TouchableOpacity
          style={styles.selectVideoButton}
          onPress={selectVideo}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.white} />
          <Text style={styles.selectVideoButtonText}>
            {videoUri ? "Change Video" : "Select Video"}
          </Text>
        </TouchableOpacity>

        {/* Caption Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={styles.textInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption for your roll..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Category Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  selectedCategory === category.id &&
                    styles.categoryOptionSelected,
                ]}
                onPress={() =>
                  setSelectedCategory(
                    category.id as "men" | "women" | "kids" | "all"
                  )
                }
              >
                <Text style={styles.categoryOptionText}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upload Button */}
        {/* Upload Status Message */}
        {!consumptionStatus.canUpload && consumptionStatus.message && (
          <View
            style={[
              styles.noShopWarning,
              {
                backgroundColor: colors.error + "20",
                borderLeftColor: colors.error,
              },
            ]}
          >
            <Text style={styles.noShopWarningText}>
              {consumptionStatus.message}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.uploadButton,
            isUploadDisabled && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={isUploadDisabled}
        >
          <Text style={styles.uploadButtonText}>
            {isLoading || isUploading ? "Uploading..." : "Upload Roll"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
