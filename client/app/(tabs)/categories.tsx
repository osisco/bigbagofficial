import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useColors,
  useCommonStyles,
  spacing,
  typography,
  borderRadius,
} from "../../styles/commonStyles";
import { Category } from "../../types";
import CategoryCard from "../../components/CategoryCard";
import { router } from "expo-router";
import { categoriesApi, handleApiError } from "../../services/api";
import { prefetchCache, CACHE_KEYS } from "../../utils/prefetchCache";

const { width } = Dimensions.get("window");
const CATEGORY_ITEM_WIDTH = (width - spacing.lg * 3) / 2;

const CategoriesScreen: React.FC = () => {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const [categories, setCategories] = useState<Category[]>([]);
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
    listContent: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.lg,
    },
    categoryRow: {
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
    },
    categoryItem: {
      width: CATEGORY_ITEM_WIDTH,
      marginBottom: spacing.md,
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

  const loadCategories = useCallback(async () => {
    try {
      setError(null);
      
      // Check prefetch cache first
      const prefetchedCategories = prefetchCache.get(CACHE_KEYS.CATEGORIES_ALL);
      if (prefetchedCategories && Array.isArray(prefetchedCategories)) {
        setCategories(prefetchedCategories);
        setIsLoading(false);
        console.log("Categories loaded from cache:", prefetchedCategories.length);
        return;
      }

      console.log("Loading categories...");

      const response = await categoriesApi.getAll();

      if (response.success && response.data) {
        setCategories(response.data);
        // Update cache
        prefetchCache.set(CACHE_KEYS.CATEGORIES_ALL, response.data, 10 * 60 * 1000);
        console.log("Categories loaded successfully:", response.data.length);
      } else {
        console.error("Failed to load categories:", response.message);
        setError(response.message || "Failed to load categories");
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCategoryPress = (category: Category) => {
    console.log("Category pressed:", category.name);
    router.push(`/category/${category.id}`);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryItem}>
      <CategoryCard category={item} onPress={() => handleCategoryPress(item)} />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={loadCategories}>
            Tap to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>Browse shops by category</Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item, index) => item.id || `category-${index}`}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.categoryRow}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};


export default CategoriesScreen;
