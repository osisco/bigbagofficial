import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useColors,
  useCommonStyles,
  spacing,
  typography,
  borderRadius,
} from "../../styles/commonStyles";
import { favoriteApi, handleApiError } from "../../services/api";
import { Shop } from "../../types";
import ShopCard from "../../components/ShopCard";
import { router } from "expo-router";

const FavoritesScreen: React.FC = () => {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const [favoriteShops, setFavoriteShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    title: {
      ...typography.h1,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.sm,
      ...typography.body,
      color: colors.text,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    row: {
      justifyContent: 'space-around',
      paddingHorizontal: spacing.sm,
    },
    shopCardWrapper: {
      flex: 1,
      marginHorizontal: spacing.xs,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      ...typography.h3,
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    emptySubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    browseButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    browseButtonText: {
      ...typography.button,
      color: colors.white,
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
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    retryText: {
      ...typography.button,
      color: colors.white,
    },
  });

  const loadFavorites = useCallback(async () => {
    try {
      setError(null);
      console.log("Loading favorite shops...");
      const response = await favoriteApi.getFavoriteShops();
      if (response.success && response.data) {
        setFavoriteShops(response.data);
        console.log("Favorite shops loaded:", response.data.length);
      } else {
        console.error("Failed to load favorites:", response.message);
        setError(response.message || "Failed to load favorites");
      }
    } catch (err) {
      console.error("Error loading favorites:", err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFavorites();
    setIsRefreshing(false);
  };

  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) {
      return favoriteShops;
    }

    return favoriteShops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [favoriteShops, searchQuery]);

  const handleShopPress = (shop: Shop) => {
    console.log("Favorite shop pressed:", shop.name);
    router.push(`/shop/${shop.id}`);
  };

  const renderShop = ({ item }: { item: Shop }) => (
    <View style={styles.shopCardWrapper}>
      <ShopCard shop={item} onPress={() => handleShopPress(item)} />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `No favorites match "${searchQuery}"`
          : "Start adding shops to your favorites to see them here"}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.push("/(tabs)/shops")}
        >
          <Text style={styles.browseButtonText}>Browse Shops</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your saved shops and deals</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your saved shops and deals</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFavorites}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          {favoriteShops.length > 0
            ? `${favoriteShops.length} saved ${favoriteShops.length === 1 ? "shop" : "shops"}`
            : "Your saved shops and deals"}
        </Text>
      </View>

      {favoriteShops.length > 0 && (
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search favorites..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={filteredShops}
        renderItem={renderShop}
        keyExtractor={(item, index) => item.id || `favorite-${index}`}
        numColumns={2}
        columnWrapperStyle={filteredShops.length > 1 ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};


export default FavoritesScreen;
