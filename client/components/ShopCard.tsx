
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../styles/commonStyles';
import { Shop } from '../types';
import { useFavorites } from '../hooks/useFavorites';

interface ShopCardProps {
  shop: Shop;
  onPress?: () => void;
  showCountries?: boolean;
}

export default function ShopCard({ shop, onPress, showCountries = true }: ShopCardProps) {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { isFavorite, toggleFavorite } = useFavorites();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      flex: 1,
      minWidth: '45%',
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      aspectRatio: 1,
      backgroundColor: colors.backgroundAlt,
    },
    logo: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    favoriteButton: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
    },
    favoriteButtonBg: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.round,
      padding: spacing.xs,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    content: {
      padding: spacing.md,
    },
    name: {
      ...typography.h4,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    description: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      minHeight: 32,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    stars: {
      flexDirection: 'row',
      marginRight: spacing.xs,
    },
    rating: {
      ...typography.caption,
      color: colors.text,
      fontWeight: '600',
    },
    countriesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      alignSelf: 'flex-start',
    },
    countries: {
      ...typography.small,
      color: colors.primary,
      marginLeft: spacing.xs,
      fontWeight: '500',
    },
  });

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    toggleFavorite(shop.id);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`full-${i}`} name="star" size={12} color={colors.accent} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={12} color={colors.accent} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={12} color={colors.textSecondary} />
      );
    }

    return stars;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: shop.logo }} style={styles.logo} />
        <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoritePress}>
          <View style={styles.favoriteButtonBg}>
            <Ionicons 
              name={isFavorite(shop.id) ? "heart" : "heart-outline"} 
              size={18} 
              color={isFavorite(shop.id) ? colors.primary : colors.text} 
            />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{shop.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{shop.description}</Text>
        
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {renderStars(shop.rating)}
          </View>
          <Text style={styles.rating}>{shop.rating.toFixed(1)}</Text>
        </View>
        
        {showCountries && shop.supportedCountries && shop.supportedCountries.length > 0 && (
          <View style={styles.countriesContainer}>
            <Ionicons name="location" size={12} color={colors.primary} />
            <Text style={styles.countries} numberOfLines={1}>
              {shop.supportedCountries.slice(0, 2).join(', ')}
              {shop.supportedCountries.length > 2 && ` +${shop.supportedCountries.length - 2}`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
