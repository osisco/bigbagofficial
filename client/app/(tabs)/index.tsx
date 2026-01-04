import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import {
  useColors,
  useCommonStyles,
  spacing,
  typography,
  borderRadius,
} from "../../styles/commonStyles";
import { Category, Coupon, Offer } from "../../types";
import CategoryCard from "../../components/CategoryCard";
import CouponCard from "../../components/CouponCard";
import OfferCard from "../../components/OfferCard";
import AdSlider from "../../components/AdSlider";
import { router } from "expo-router";
import {
  categoriesApi,
  couponsApi,
  offersApi,
  handleApiError,
} from "../../services/api";
import { useProgressiveLoading } from "../../hooks/useProgressiveLoading";

const { width } = Dimensions.get("window");
const CATEGORY_ITEM_WIDTH = (width - spacing.lg * 3) / 2;

const HomeScreen: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const colors = useColors();
  const commonStyles = useCommonStyles();

  const styles = StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconButton: {
      padding: spacing.xs,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
    },
    title: {
      ...typography.h1,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    logo: {
      width: 40,
      height: 40,
      marginRight: 4,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
    },
    seeAll: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
    },
    horizontalList: {
      paddingHorizontal: spacing.sm,
    },
    categoryItem: {
      width: CATEGORY_ITEM_WIDTH,
      marginBottom: spacing.md,
    },
    categoryRow: {
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
    },
    categoriesContainer: {
      paddingBottom: spacing.lg,
    },
    couponItem: {
      marginRight: spacing.md,
    },
    offerItem: {
      marginRight: spacing.md,
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
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
  
  const { loadingStates, setLoading, resetLoading, isAllLoaded } = useProgressiveLoading([
    'coupons', 'offers', 'categories'
  ]);

  const loadCoupons = useCallback(async () => {
    try {
      const response = await couponsApi.getAll();
      if (response.success && response.data) {
        setCoupons(response.data.slice(0, 5));
      }
    } catch (err) {
      console.error("Error loading coupons:", err);
    } finally {
      setLoading('coupons', false);
    }
  }, [setLoading]);

  const loadOffers = useCallback(async () => {
    try {
      const response = await offersApi.getAll();
      if (response.success && response.data) {
        setOffers(response.data.slice(0, 5));
      }
    } catch (err) {
      console.error("Error loading offers:", err);
    } finally {
      setLoading('offers', false);
    }
  }, [setLoading]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getAll();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoading('categories', false);
    }
  }, [setLoading]);

  const loadData = useCallback(async () => {
    setError(null);
    resetLoading(['coupons', 'offers', 'categories']);
    
    // Load sections progressively with delays
    setTimeout(loadCoupons, 100);
    setTimeout(loadOffers, 300);
    setTimeout(loadCategories, 500);
  }, [loadCoupons, loadOffers, loadCategories, resetLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    loadData();
    // Wait for all sections to load
    const checkLoading = setInterval(() => {
      if (isAllLoaded) {
        setIsRefreshing(false);
        clearInterval(checkLoading);
      }
    }, 100);
  };

  const handleCategoryPress = useCallback((category: Category) => {
    router.push(`/category/${category.id}`);
  }, []);

  const handleCouponPress = useCallback((coupon: Coupon) => {
    router.push(`/shop/${coupon.shopId}`);
  }, []);

  const handleOfferPress = useCallback((offer: Offer) => {
    router.push(`/shop/${offer.shopId}`);
  }, []);

  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => (
      <View style={styles.categoryItem}>
        <CategoryCard
          category={item}
          onPress={() => handleCategoryPress(item)}
        />
      </View>
    ),
    [handleCategoryPress]
  );

  const renderCouponItem = useCallback(
    ({ item }: { item: Coupon }) => (
      <View style={styles.couponItem}>
        <CouponCard coupon={item} onPress={() => handleCouponPress(item)} />
      </View>
    ),
    [handleCouponPress]
  );

  const renderOfferItem = useCallback(
    ({ item }: { item: Offer }) => (
      <View style={styles.offerItem}>
        <OfferCard offer={item} onPress={() => handleOfferPress(item)} />
      </View>
    ),
    [handleOfferPress]
  );

  const SkeletonLoader = ({ height = 120, width = '100%' }: { height?: number; width?: string | number }) => (
    <View style={[{ height, width, backgroundColor: colors.border, borderRadius: borderRadius.md, opacity: 0.6 }]} />
  );

  if (error) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={loadData}>
            Tap to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.titleContainer}>
              <Image 
                source={require('../../assets/images/toplogo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.title, { color: colors.text, marginTop: 10 }]}>igbag</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Reach abroad, discover local</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/(tabs)/favorites')}
            >
              <Ionicons name="heart-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/(tabs)/account')}
            >
              <Ionicons name="person-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Advertisement Slider */}
        <AdSlider />

        {/* Coupons Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hot Coupons</Text>
            <Text
              style={styles.seeAll}
              onPress={() => router.push("/(tabs)/coupons")}
            >
              See All
            </Text>
          </View>
          {loadingStates.coupons ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.couponItem}>
                  <SkeletonLoader height={120} width={280} />
                </View>
              ))}
            </ScrollView>
          ) : coupons.length > 0 ? (
            <FlatList
              data={coupons}
              renderItem={renderCouponItem}
              keyExtractor={(item, index) => item.id || `coupon-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
              removeClippedSubviews={true}
            />
          ) : (
            <Text style={styles.emptyText}>No coupons available</Text>
          )}
        </View>

        {/* Offers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Limited Offers</Text>
            <Text
              style={styles.seeAll}
              onPress={() => router.push("/(tabs)/shops")}
            >
              See All
            </Text>
          </View>
          {loadingStates.offers ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3].map(i => (
                <View key={i} style={styles.offerItem}>
                  <SkeletonLoader height={120} width={250} />
                </View>
              ))}
            </ScrollView>
          ) : offers.length > 0 ? (
            <FlatList
              data={offers}
              renderItem={renderOfferItem}
              keyExtractor={(item, index) => item.id || `offer-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
              removeClippedSubviews={true}
            />
          ) : (
            <Text style={styles.emptyText}>No offers available</Text>
          )}
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            &nbsp;&nbsp;&nbsp;&nbsp;Shop by Category
          </Text>
          {loadingStates.categories ? (
            <View style={styles.categoriesContainer}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={styles.categoryRow}>
                  <SkeletonLoader height={100} width={CATEGORY_ITEM_WIDTH} />
                  <SkeletonLoader height={100} width={CATEGORY_ITEM_WIDTH} />
                </View>
              ))}
            </View>
          ) : categories.length > 0 ? (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item, index) => item.id || `category-${index}`}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.categoryRow}
              contentContainerStyle={styles.categoriesContainer}
            />
          ) : (
            <Text style={styles.emptyText}>No categories available</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


export default HomeScreen;
