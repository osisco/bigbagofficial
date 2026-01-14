
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography} from '../../styles/commonStyles';
import { shopsApi, categoriesApi, handleApiError } from '../../services/api';
import { Shop, Category } from '../../types';
import ShopCard from '../../components/ShopCard';

const CategoryScreen: React.FC = () => {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shops, setShops] = useState<Shop[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    backButton: {
      marginRight: spacing.md,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      ...typography.h2,
      color: colors.text,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    row: {
      justifyContent: 'space-between',
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
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    loadCategoryShops();
  }, [id]);

  const loadCategoryShops = async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!id) {
        setError('Category ID not found');
        return;
      }

      console.log('Loading category:', id);

      // Load category details
      const categoryResponse = await categoriesApi.getById(id);
      if (categoryResponse.success && categoryResponse.data) {
        setCategory(categoryResponse.data);
      } else {
        setError(categoryResponse.message || 'Failed to load category');
        return;
      }

      // Load shops for this category
      const shopsResponse = await shopsApi.getAll({
        category: id,
      });

      if (shopsResponse.success && shopsResponse.data) {
        setShops(shopsResponse.data);
        console.log('Shops loaded:', shopsResponse.data.length);
      } else {
        console.error('Failed to load shops:', shopsResponse.message);
        setError(shopsResponse.message || 'Failed to load shops');
      }
    } catch (err) {
      console.error('Error loading category shops:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleShopPress = (shop: Shop) => {
    console.log('Shop pressed:', shop.name);
    router.push(`/shop/${shop.id}`);
  };

  const renderShop = ({ item }: { item: Shop }) => (
    <View style={styles.shopCardWrapper}>
      <ShopCard shop={item} onPress={() => handleShopPress(item)} />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="storefront-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Shops Found</Text>
      <Text style={styles.emptySubtitle}>
        No shops available in this category yet
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !category) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Category not found'}</Text>
          <Text style={styles.retryText} onPress={loadCategoryShops}>Tap to retry</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{category.name}</Text>
          <Text style={styles.subtitle}>{shops.length} shops available</Text>
        </View>
      </View>

      <FlatList
        data={shops}
        renderItem={renderShop}
        keyExtractor={(item, index) => item.id || `shop-${index}`}
        numColumns={2}
        columnWrapperStyle={shops.length > 1 ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
      />
    </SafeAreaView>
  );
};


export default CategoryScreen;
