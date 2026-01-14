
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Linking, Alert, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import CouponCard from '../../components/CouponCard';
import { useColors, useCommonStyles, spacing, typography,  borderRadius } from '../../styles/commonStyles';
import * as Clipboard from 'expo-clipboard';
import { couponsApi, shopsApi, handleApiError } from '../../services/api';
import { Coupon, Shop } from '../../types';
import { prefetchCache, CACHE_KEYS } from '../../utils/prefetchCache';

export default function CouponsScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
    listContainer: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.xl,
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

  const loadData = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setError(null);
        setIsLoading(true);
        
        // Check prefetch cache for first page
        if (page === 1) {
          const prefetchedCoupon = prefetchCache.get(CACHE_KEYS.COUPONS_FIRST);
          if (prefetchedCoupon) {
            // Use prefetched coupon immediately for instant UI
            setCoupons([prefetchedCoupon]);
            setIsLoading(false);
            
            // Load rest in background
            const couponsResponse = await couponsApi.getAll({ page, limit: 20 });
            if (couponsResponse.success && couponsResponse.data) {
              // Ensure prefetched coupon is first, deduplicate
              const otherCoupons = couponsResponse.data.filter(
                (c: Coupon) => c.id !== prefetchedCoupon.id
              );
              setCoupons([prefetchedCoupon, ...otherCoupons]);
              setHasNextPage(couponsResponse.pagination?.hasNextPage || false);
              setCurrentPage(page);
            }
            
            // Load shops in background
            const shopsResponse = await shopsApi.getAll();
            if (shopsResponse.success && shopsResponse.data) {
              setShops(shopsResponse.data);
            }
            return;
          }
        }
      } else {
        setIsLoadingMore(true);
      }
      
      console.log(`Loading coupons page ${page}...`);
      
      // Load coupons with pagination
      const couponsResponse = await couponsApi.getAll({ page, limit: 20 });
      
      if (couponsResponse.success && couponsResponse.data) {
        if (append) {
          // Deduplicate by ID to prevent duplicate keys
          setCoupons(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newCoupons = couponsResponse.data.filter(c => c.id && !existingIds.has(c.id));
            return [...prev, ...newCoupons];
          });
        } else {
          setCoupons(couponsResponse.data);
        }
        setHasNextPage(couponsResponse.pagination?.hasNextPage || false);
        setCurrentPage(page);
      }
      
      // Load shops for reference (only on first load)
      if (page === 1) {
        const shopsResponse = await shopsApi.getAll();
        if (shopsResponse.success && shopsResponse.data) {
          setShops(shopsResponse.data);
        }
      }
      
      console.log('Coupons loaded successfully');
    } catch (err) {
      console.error('Error loading coupons:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    await loadData(1, false);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasNextPage) {
      loadData(currentPage + 1, true);
    }
  };

  const filteredCoupons = coupons.filter(coupon =>
    !searchQuery || 
    coupon.shopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCouponPress = useCallback(async (coupon: Coupon) => {
    try {
      // Copy the coupon code to clipboard
      await Clipboard.setStringAsync(coupon.code);
      
      // Find the associated shop from already loaded shops
      const shop = shops.find(s => s.id === coupon.shopId);
      
      if (shop) {
        // Navigate directly to shop like in home tab
        router.push(`/shop/${shop.id}`);
      }
    } catch (error) {
      console.log('Error handling coupon press:', error);
      Alert.alert('Error', 'Failed to copy coupon code');
    }
  }, [shops]);



  const renderCoupon = ({ item }: { item: Coupon }) => (
    <CouponCard
      coupon={item}
      onPress={() => handleCouponPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="ticket-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Coupons Available</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'No coupons match your search criteria'
          : 'No coupons available right now'
        }
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading coupons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={loadData}>Tap to retry</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coupons</Text>
        <Text style={styles.subtitle}>
          {filteredCoupons.length} coupon{filteredCoupons.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search coupons, stores, or codes..."
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
        data={filteredCoupons}
        renderItem={renderCoupon}
        keyExtractor={(item, index) => item.id || `coupon-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => 
          isLoadingMore ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

