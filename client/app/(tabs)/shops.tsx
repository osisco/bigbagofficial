import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../../styles/commonStyles';
import { Shop } from '../../types';
import ShopCard from '../../components/ShopCard';
import { router } from 'expo-router';
import { shopsApi, handleApiError } from '../../services/api';

const ShopsScreen: React.FC = () => {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

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
      paddingBottom: 100,
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

  const loadShops = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1) {
        setError(null);
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      console.log(`Loading shops page ${pageNum}...`);
      
      const response = await shopsApi.getAll({ page: pageNum, limit: ITEMS_PER_PAGE });
      
      if (response.success && response.data) {
        const newShops = response.data;
        
        if (pageNum === 1 || isRefresh) {
          setShops(newShops);
        } else {
          setShops(prev => [...prev, ...newShops]);
        }
        
        setHasMore(newShops.length === ITEMS_PER_PAGE);
        setPage(pageNum);
        console.log(`Shops page ${pageNum} loaded:`, newShops.length);
      } else {
        console.error('Failed to load shops:', response.message);
        setError(response.message || 'Failed to load shops');
      }
    } catch (err) {
      console.error('Error loading shops:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    await loadShops(1, true);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadShops(page + 1);
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: spacing.lg }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const filteredShops = shops.filter(shop =>
    !searchQuery.trim() ||
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {searchQuery 
          ? `No shops match "${searchQuery}"`
          : 'No shops available at the moment'
        }
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Shops</Text>
          <Text style={styles.subtitle}>Discover amazing stores</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Shops</Text>
          <Text style={styles.subtitle}>Discover amazing stores</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadShops}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shops</Text>
        <Text style={styles.subtitle}>Discover amazing stores and deals</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredShops}
        renderItem={renderShop}
        keyExtractor={(item, index) => item.id || `shop-${index}`}
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};


export default ShopsScreen;
