import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useColors,
  useCommonStyles,
  spacing,
  typography,
  borderRadius,
} from "../styles/commonStyles";
import { Roll } from "../types";
import { useAuth } from "../hooks/useAuth";
import { saveApi, handleApiError } from "../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SAVED_REEL_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;


export default function SavedReelsScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { isAuthenticated } = useAuth();
  const [savedReels, setSavedReels] = useState<Roll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.sm,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    savedReelsGrid: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    savedRollCard: {
      width: SAVED_REEL_WIDTH,
      aspectRatio: 9/16,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
    },
    savedReelThumbnail: {
      flex: 1,
      backgroundColor: colors.card,
    },
    savedReelOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: spacing.sm,
    },
    savedReelShopName: {
      ...typography.caption,
      color: colors.white,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    savedReelStats: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    savedReelStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    savedReelStatText: {
      ...typography.small,
      color: colors.white,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    emptyStateIcon: {
      marginBottom: spacing.md,
    },
    emptyStateText: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    emptyStateSubtext: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    retryText: {
      ...typography.button,
      color: colors.primary,
    },
  });

  useEffect(() => {
    loadSavedReels();
  }, []);

  const loadSavedReels = async () => {
    try {
      setError(null);
      setIsLoading(true);
      console.log("Loading saved rolls from API...");

      const response = await saveApi.getSavedRolls();
      if (response.success && response.data) {
        console.log("Loaded saved rolls from API:", response.data.length);
        setSavedReels(response.data);
      } else {
        console.log("API returned no saved rolls");
        setSavedReels([]);
      }
    } catch (err) {
      console.error("Error loading saved rolls:", err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setSavedReels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const handleSavedReelPress = useCallback((rollId: string) => {
    console.log("Navigating to roll:", rollId);
    // Navigate to rolls tab - the rolls screen will handle showing the specific roll
    router.push("/(tabs)/rolls");
  }, []);

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderSavedReel = useCallback(
    ({ item }: { item: Roll }) => (
      <TouchableOpacity
        style={styles.savedRollCard}
        onPress={() => handleSavedReelPress(item.id)}
      >
        <View
          style={[
            styles.savedReelThumbnail,
            {
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Ionicons name="play-circle" size={48} color={colors.white} />
        </View>
        <View style={styles.savedReelOverlay}>
          <Text style={styles.savedReelShopName} numberOfLines={1}>
            {item.shopName}
          </Text>
          <View style={styles.savedReelStats}>
            <View style={styles.savedReelStat}>
              <Ionicons name="heart" size={12} color={colors.white} />
              <Text style={styles.savedReelStatText}>
                {formatCount(item.likes)}
              </Text>
            </View>
            <View style={styles.savedReelStat}>
              <Ionicons name="chatbubble" size={12} color={colors.white} />
              <Text style={styles.savedReelStatText}>
                {formatCount(item.comments.length)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleSavedReelPress]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Ionicons
          name="bookmark-outline"
          size={80}
          color={colors.textSecondary}
          style={styles.emptyStateIcon}
        />
        <Text style={styles.emptyStateText}>No Saved Rolls</Text>
        <Text style={styles.emptyStateSubtext}>
          Rolls you save will appear here. Start exploring and save your
          favorites!
        </Text>
      </View>
    ),
    []
  );

  const keyExtractor = useCallback((item: Roll) => `saved-roll-${item.id}`, []);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Rolls</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="lock-closed-outline"
            size={80}
            color={colors.textSecondary}
            style={styles.emptyStateIcon}
          />
          <Text style={styles.emptyStateText}>Sign In Required</Text>
          <Text style={styles.emptyStateSubtext}>
            Please sign in to view your saved rolls
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Rolls</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading saved rolls...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Rolls</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={loadSavedReels}>
            Tap to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Saved Rolls ({savedReels.length})
        </Text>
      </View>

      <View style={styles.content}>
        {savedReels.length > 0 ? (
          <FlatList
            data={savedReels}
            renderItem={renderSavedReel}
            keyExtractor={keyExtractor}
            numColumns={2}
            contentContainerStyle={styles.savedReelsGrid}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
}
