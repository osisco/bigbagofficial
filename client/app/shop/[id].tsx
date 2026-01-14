
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Linking, Alert, ActivityIndicator, TextInput, Modal, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography,  borderRadius } from '../../styles/commonStyles';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '../../hooks/useAuth';
import { useCountry } from '../../hooks/useCountry';
import { shopsApi, offersApi, couponsApi, handleApiError } from '../../services/api';
import { COUNTRIES } from '../../constants/countries';
import OfferCard from '../../components/OfferCard';
import CouponCard from '../../components/CouponCard';
import ShopRolls from '../../components/ShopRolls';
import { Shop, Offer, Coupon, Review } from '../../types';

export default function ShopDetailsScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { selectedCountry } = useCountry();
  const [activeTab, setActiveTab] = useState<'offers' | 'coupons' | 'rolls' | 'reviews'>('offers');
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopOffers, setShopOffers] = useState<Offer[]>([]);
  const [shopCoupons, setShopCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
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
      padding: spacing.lg,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    backText: {
      ...typography.body,
      color: colors.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
    },
    backButton: {
      padding: spacing.sm,
    },
    favoriteButton: {
      padding: spacing.sm,
    },
    shopInfo: {
      padding: spacing.lg,
      alignItems: 'center',
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
    },
    shopName: {
      ...typography.h2,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    stars: {
      flexDirection: 'row',
      marginRight: spacing.sm,
    },
    rating: {
      ...typography.bodyBold,
      color: colors.text,
      marginRight: spacing.xs,
    },
    reviewCount: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    writeReviewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    writeReviewText: {
      ...typography.body,
      color: colors.primary,
      marginLeft: spacing.xs,
    },
    countriesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    countries: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    visitButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    visitButtonText: {
      ...typography.bodyBold,
      color: colors.white,
      marginRight: spacing.sm,
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      minWidth: 0,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      padding: spacing.md,
    },
    offersContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.sm,
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
    emptySubtext: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    reviewItem: {
      backgroundColor: colors.card,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    reviewUserInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    reviewAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    reviewUserDetails: {
      flex: 1,
    },
    reviewUserName: {
      ...typography.bodyBold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    reviewStars: {
      flexDirection: 'row',
    },
    reviewDate: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    reviewComment: {
      ...typography.body,
      color: colors.text,
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: '100%',
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      ...typography.h3,
      color: colors.text,
    },
    modalLabel: {
      ...typography.bodyBold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    ratingStars: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    reviewInput: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      ...typography.body,
      color: colors.text,
      minHeight: 100,
      marginBottom: spacing.lg,
    },
    submitReviewButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    submitReviewButtonDisabled: {
      backgroundColor: colors.border,
    },
    submitReviewButtonText: {
      ...typography.bodyBold,
      color: colors.white,
    },
  });

  useEffect(() => {
    loadShopDetails();
  }, [id]);

  const loadShopDetails = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      if (!id || id === 'undefined' || typeof id !== 'string') {
        setError('Invalid shop ID');
        setIsLoading(false);
        return;
      }

      console.log('Loading shop details for ID:', id);

      const shopResponse = await shopsApi.getById(id);
      if (shopResponse.success && shopResponse.data) {
        setShop(shopResponse.data);
      } else {
        setError(shopResponse.message || 'Failed to load shop');
        return;
      }

      const offersResponse = await offersApi.getByShop(id);
      if (offersResponse.success && offersResponse.data) {
        setShopOffers(offersResponse.data);
      }

      const couponsResponse = await couponsApi.getAll();
      if (couponsResponse.success && couponsResponse.data) {
        const filtered = couponsResponse.data.filter((c: Coupon) => c.shopId === id);
        setShopCoupons(filtered);
      }

      await loadReviews();
    } catch (err) {
      console.error('Error loading shop details:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const loadReviews = async () => {
    try {
      if (!id || id === 'undefined' || typeof id !== 'string') return;
      
      const response = await shopsApi.getReviews(id);
      if (response.success && response.data) {
        setReviews(response.data);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  const handleSubmitRating = async () => {
    if (userRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!userComment.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    if (!id || id === 'undefined' || typeof id !== 'string') {
      Alert.alert('Error', 'Invalid shop ID');
      return;
    }

    setIsSubmittingRating(true);
    try {
      const response = await shopsApi.submitReview(id, {
        rating: userRating,
        comment: userComment.trim(),
      });

      if (response.success) {
        Alert.alert('Success', 'Your review has been submitted!');
        setShowRatingModal(false);
        setUserRating(0);
        setUserComment('');
        await loadReviews();
        await loadShopDetails();
      } else {
        Alert.alert('Error', response.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      Alert.alert('Error', handleApiError(err));
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading shop details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !shop) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Shop not found'}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      // If user is authenticated, backend will use their account country automatically
      // Only send country for guest users
      let countryToSend = null;
      
      if (!user && selectedCountry) {
        // For guest users, send selectedCountry code
        countryToSend = selectedCountry;
      }
      // For authenticated users, don't send country - backend uses account country
      
      await shopsApi.share(shop.id, countryToSend);
      const link = `https://bigbag.app/shop/${shop.id}`;
      await Share.share({
        message: `Check out ${shop.name} on BigBag! ${shop.description} ${link}`,
        url: link,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleVisitShop = async () => {
    try {
      const supported = await Linking.canOpenURL(shop.link);
      if (supported) {
        await Linking.openURL(shop.link);
      } else {
        Alert.alert('Error', 'Cannot open shop link');
      }
    } catch (error) {
      console.log('Error opening link:', error);
      Alert.alert('Error', 'Failed to open shop link');
    }
  };

  const handleFavoritePress = () => {
    toggleFavorite(shop.id);
  };

  const renderStars = (rating: number, size: number = 16, interactive: boolean = false) => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      stars.push(
        <TouchableOpacity
          key={`star-${i}-${interactive ? 'interactive' : 'static'}`}
          onPress={() => interactive && setUserRating(i)}
          disabled={!interactive}
        >
          <Ionicons 
            name={filled ? "star" : "star-outline"} 
            size={size} 
            color={filled ? colors.accent : colors.textSecondary} 
          />
        </TouchableOpacity>
      );
    }

    return stars;
  };

  const renderReviewItem = (review: Review) => (
    <View key={review.id} style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserInfo}>
          <View style={styles.reviewAvatar}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.reviewUserDetails}>
            <Text style={styles.reviewUserName}>{review.userName}</Text>
            <View style={styles.reviewStars}>
              {renderStars(review.rating, 12)}
            </View>
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {new Date(review.date).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {(shop.vendorId?._id === user?.id || shop.vendorId?.id === user?.id) && (
              <TouchableOpacity 
                style={[styles.favoriteButton, { marginRight: spacing.sm }]} 
                onPress={() => router.push(`/vendor/edit-shop/${shop.id}`)}
              >
                <Ionicons name="create-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.favoriteButton, { marginRight: spacing.sm }]} 
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoritePress}>
              <Ionicons 
                name={isFavorite(shop.id) ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite(shop.id) ? colors.primary : colors.text} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.shopInfo}>
          <Image source={{ uri: shop.logo }} style={styles.logo} />
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.description}>{shop.description}</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(shop.rating)}
            </View>
            <Text style={styles.rating}>{shop.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({shop.reviewCount} reviews)</Text>
          </View>

          <TouchableOpacity 
            style={styles.writeReviewButton}
            onPress={() => setShowRatingModal(true)}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.writeReviewText}>Write a Review</Text>
          </TouchableOpacity>

          <View style={styles.countriesContainer}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.countries}>
              Available in: {shop.supportedCountries.join(', ')}
            </Text>
          </View>

          <TouchableOpacity style={styles.visitButton} onPress={handleVisitShop}>
            <Text style={styles.visitButtonText}>Visit Shop</Text>
            <Ionicons name="open-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'offers' && styles.activeTab]}
            onPress={() => setActiveTab('offers')}
          >
            <Text style={[styles.tabText, activeTab === 'offers' && styles.activeTabText]}>
              Offers ({shopOffers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'coupons' && styles.activeTab]}
            onPress={() => setActiveTab('coupons')}
          >
            <Text style={[styles.tabText, activeTab === 'coupons' && styles.activeTabText]}>
              Coupons ({shopCoupons.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rolls' && styles.activeTab]}
            onPress={() => setActiveTab('rolls')}
          >
            <Text style={[styles.tabText, activeTab === 'rolls' && styles.activeTabText]}>
              Rolls
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Reviews ({reviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'offers' ? (
            shopOffers.length > 0 ? (
              <View style={styles.offersContainer}>
                {shopOffers.map(offer => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No offers available</Text>
              </View>
            )
          ) : activeTab === 'coupons' ? (
            shopCoupons.length > 0 ? (
              shopCoupons.map(coupon => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="ticket-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No coupons available</Text>
              </View>
            )
          ) : activeTab === 'rolls' ? (
            <ShopRolls shopId={id!} nested={true} />
          ) : (
            reviews.length > 0 ? (
              reviews.map(review => renderReviewItem(review))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No reviews yet</Text>
                <Text style={styles.emptySubtext}>Be the first to review this shop!</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Your Rating</Text>
            <View style={styles.ratingStars}>
              {renderStars(userRating, 32, true)}
            </View>

            <Text style={styles.modalLabel}>Your Review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience with this shop..."
              placeholderTextColor={colors.textSecondary}
              value={userComment}
              onChangeText={setUserComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.submitReviewButton,
                (userRating === 0 || !userComment.trim() || isSubmittingRating) && styles.submitReviewButtonDisabled
              ]}
              onPress={handleSubmitRating}
              disabled={userRating === 0 || !userComment.trim() || isSubmittingRating}
            >
              <Text style={styles.submitReviewButtonText}>
                {isSubmittingRating ? 'Submitting...' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

