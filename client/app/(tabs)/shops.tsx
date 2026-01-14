import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useColors,
  useCommonStyles,
  spacing,
  typography,
  borderRadius,
} from '../../styles/commonStyles';
import { Shop } from '../../types';
import ShopCard from '../../components/ShopCard';
import { router } from 'expo-router';
import { shopsApi, handleApiError } from '../../services/api';
import { useCountry } from '../../hooks/useCountry';
import { useAuth } from '../../hooks/useAuth';
import { COUNTRIES } from '../../constants/countries';

const ITEMS_PER_PAGE = 10;

const ShopsScreen: React.FC = () => {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { selectedCountry } = useCountry();
  const { user } = useAuth();

  const [shops, setShops] = useState<Shop[]>([]);
  const [topSharedShops, setTopSharedShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /* ----------------------------- STYLES ----------------------------- */

  const styles = StyleSheet.create({
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    title: {
      ...typography.h1,
      color: colors.text,
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
      justifyContent: 'space-between',
    },
    shopCardWrapper: {
      flex: 1,
      marginHorizontal: spacing.xs,
    },
    loadingContainer: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.sm,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    sectionTitle: {
      ...typography.h3,
      marginLeft: spacing.sm,
      color: colors.text,
    },
    topSharedContainer: {
      paddingBottom: spacing.md,
      marginBottom: spacing.md,
    },
    topSharedList: {
      paddingLeft: spacing.lg,
      paddingRight: spacing.lg,
    },
    topSharedShopWrapper: {
      width: 160,
      marginRight: spacing.md,
    },
  });

  /* ----------------------------- DATA LOADERS ----------------------------- */

  const loadTopSharedShops = useCallback(async () => {
    // If user is authenticated, backend will use their account country automatically
    // Don't send country parameter - let backend handle it from user's account
    if (!user) {
      // For guests, use selectedCountry from localStorage
      if (!selectedCountry) {
        setTopSharedShops([]);
        return;
      }
      // Convert country code to country name for guest users
      const country = COUNTRIES.find(c => c.code === selectedCountry);
      const countryName = country?.name || selectedCountry;
      
      try {
        console.log('Loading top shared shops for guest, country:', countryName);
        const res = await shopsApi.getTopSharedThisWeek(countryName);
        handleTopSharedResponse(res);
      } catch (err) {
        console.error('Error loading top shared shops:', err);
      }
      return;
    }

    // For authenticated users, don't send country - backend uses account country
    try {
      console.log('Loading top shared shops for authenticated user (account country:', user.country, ')');
      const res = await shopsApi.getTopSharedThisWeek(); // No country parameter
      handleTopSharedResponse(res);
    } catch (err) {
      console.error('Error loading top shared shops:', err);
    }
  }, [user, selectedCountry]);

  const handleTopSharedResponse = (res: any) => {
    console.log('Top shared API response:', res);

    // Handle both response shapes: { success, data } or direct array
    if (Array.isArray(res)) {
      console.log('Setting top shared shops (array):', res.length);
      setTopSharedShops(res);
    } else if (res?.success && Array.isArray(res.data)) {
      console.log('Setting top shared shops (success):', res.data.length);
      setTopSharedShops(res.data);
    } else if (res?.success && res.data === null) {
      // Empty result is valid
      console.log('No top shared shops found for this week');
      setTopSharedShops([]);
    } else {
      console.warn('Unexpected top shared shops response format:', res);
      setTopSharedShops([]);
    }
  };


  const loadShops = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      if (!selectedCountry) return;

      try {
        if (pageNum === 1) {
          setIsInitialLoading(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const res = await shopsApi.getAll({
          page: pageNum,
          limit: ITEMS_PER_PAGE,
          country: selectedCountry,
        });

        if (res?.success && Array.isArray(res.data)) {
          if (pageNum === 1 || isRefresh) {
            setShops(res.data);
          } else {
            // Deduplicate by ID to prevent duplicate keys
            setShops(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const newShops = res.data.filter(s => s.id && !existingIds.has(s.id));
              return [...prev, ...newShops];
            });
          }
          setHasMore(res.data.length === ITEMS_PER_PAGE);
          setPage(pageNum);
        } else {
          setError(res?.message || 'Failed to load shops');
        }
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCountry]
  );

  /* ----------------------------- EFFECTS ----------------------------- */

  useEffect(() => {
    console.log("Selected country changed:", selectedCountry);
    if (!selectedCountry) {
      setTopSharedShops([]);
      return;
    }
    loadShops(1, true);
    loadTopSharedShops();
  }, [selectedCountry, loadShops, loadTopSharedShops]);

  /* ----------------------------- HANDLERS ----------------------------- */

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setHasMore(true);
    setPage(1);
    await Promise.all([loadShops(1, true), loadTopSharedShops()]);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadShops(page + 1);
    }
  };

  const handleShopPress = (shop: Shop) => {
    if (!shop.id) return;
    router.push(`/shop/${shop.id}`);
  };

  /* ----------------------------- RENDER HELPERS ----------------------------- */

  const filteredShops = shops.filter(shop =>
    !searchQuery ||
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
  );

  const renderTopSharedSection = () => {
    // Always show the section header, but conditionally show content
    return (
      <View style={styles.topSharedContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Top Shared This Week</Text>
        </View>

        {topSharedShops.length > 0 ? (
          <FlatList
            data={topSharedShops}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => `top-${item.id || String(item)}`}
            renderItem={({ item }) => (
              <View style={styles.topSharedShopWrapper}>
                <ShopCard
                  shop={item}
                  showCountries={false}
                  onPress={() => handleShopPress(item)}
                />
              </View>
            )}
            contentContainerStyle={styles.topSharedList}
            snapToInterval={160 + spacing.md}
            snapToAlignment="start"
            decelerationRate="fast"
            removeClippedSubviews={true}
            initialNumToRender={3}
            maxToRenderPerBatch={5}
            windowSize={5}
          />
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              No top shared shops this week for your country
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () =>
    isLoadingMore ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    ) : null;
const renderListHeader = () => {
  return (
    <>
      {renderTopSharedSection()}
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <Text style={styles.sectionTitle}>All Shops</Text>
      </View>
    </>
  );
};

  const renderEmpty = () =>
    isInitialLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading shops...</Text>
      </View>
    ) : (
      <View style={styles.emptyState}>
        <Ionicons
          name="storefront-outline"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyText}>No shops found</Text>
      </View>
    );

  /* ----------------------------- RENDER ----------------------------- */

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
      </View>

      <FlatList
  data={filteredShops}
  renderItem={({ item }) => (
    <View style={styles.shopCardWrapper}>
      <ShopCard shop={item} onPress={() => handleShopPress(item)} />
    </View>
  )}
            keyExtractor={(item, index) => item.id || `shop-${index}`}
  numColumns={2}
  columnWrapperStyle={filteredShops.length > 1 ? styles.row : undefined}
  contentContainerStyle={styles.listContent}
  ListHeaderComponent={renderListHeader}  // <-- updated here
  ListFooterComponent={renderFooter}
  ListEmptyComponent={renderEmpty}
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
    />
  }
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.2}
  showsVerticalScrollIndicator={false}
/>

    </SafeAreaView>
  );
};

export default ShopsScreen;
