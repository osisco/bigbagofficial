import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useCommonStyles, spacing, borderRadius, typography } from '../styles/commonStyles';
import { Offer } from '../types';
import { offersApi } from '../services/api';

interface OfferCardProps {
  offer: Offer;
  onPress?: () => void;
  onDelete?: (offerId: string) => void;
  shopOwnerId?: string; // Add shop owner ID
}

export default function OfferCard({ offer, onPress, onDelete, shopOwnerId }: OfferCardProps) {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const [canDelete, setCanDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkDeletePermission = async () => {
      try {
        const authState = await AsyncStorage.getItem('auth_state');
        if (authState) {
          const authData = JSON.parse(authState);
          const user = authData.user;
          
          if (user) {
            const isAdmin = user.role === 'admin';
            const isShopOwner = shopOwnerId && (user.id === shopOwnerId || user._id === shopOwnerId);
            setCanDelete(isAdmin || isShopOwner);
          }
        }
      } catch (error) {
        console.error('Error checking delete permission:', error);
      }
    };
    checkDeletePermission();
  }, [shopOwnerId]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      marginHorizontal: spacing.xs,
      marginVertical: spacing.sm,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      width: 220,
      alignSelf: 'center',
    },
    expiredContainer: {
      opacity: 0.6,
    },
    image: {
      width: '100%',
      height: 150,
      resizeMode: 'cover',
    },
    limitedBadge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    limitedText: {
      ...typography.small,
      color: colors.white,
      fontWeight: '600',
    },
    expiredOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    expiredText: {
      ...typography.h2,
      color: colors.white,
      fontWeight: '800',
    },
    content: {
      padding: spacing.md,
    },
    shopName: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    title: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    priceContainer: {
      marginBottom: spacing.sm,
    },
    discount: {
      ...typography.h3,
      color: colors.primary,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    originalPrice: {
      ...typography.body,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
      marginRight: spacing.sm,
    },
    salePrice: {
      ...typography.h3,
      color: colors.success,
      fontWeight: '600',
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundAlt,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      alignSelf: 'flex-start',
    },
    timer: {
      ...typography.small,
      color: colors.warning,
      fontWeight: '600',
      marginLeft: spacing.xs,
    },
    deleteButton: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      backgroundColor: colors.error,
      borderRadius: borderRadius.sm,
      padding: spacing.xs,
      zIndex: 1,
    },
  });

  const getTimeRemaining = () => {
    if (!offer.expiryDate) return null;
    
    const expiryDate = new Date(offer.expiryDate);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h left`;
    } else {
      return `${diffHours}h left`;
    }
  };

  const timeRemaining = getTimeRemaining();
  const isExpired = timeRemaining === 'Expired';

  const handleDelete = async (e: any) => {
    e.stopPropagation();
    Alert.alert(
      "Delete Offer",
      "Are you sure you want to delete this offer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const res = await offersApi.delete(offer.id);
              if (res.success) {
                onDelete?.(offer.id);
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete offer');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.container, isExpired && styles.expiredContainer]} 
      onPress={onPress} 
      activeOpacity={0.7}
      disabled={isExpired}
    >
      {canDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="trash-outline" size={16} color={colors.white} />
          )}
        </TouchableOpacity>
      )}
      
      <Image source={{ uri: offer.image }} style={styles.image} />
      
      {offer.isLimited && !isExpired && (
        <View style={styles.limitedBadge}>
          <Text style={styles.limitedText}>Limited Time</Text>
        </View>
      )}
      
      {isExpired && (
        <View style={styles.expiredOverlay}>
          <Text style={styles.expiredText}>EXPIRED</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.shopName}>{offer.shopName}</Text>
        <Text style={styles.title} numberOfLines={2}>{offer.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{offer.description}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.discount}>{offer.discount} OFF</Text>
          {offer.originalPrice && offer.salePrice && (
            <View style={styles.priceRow}>
              <Text style={styles.originalPrice}>{offer.originalPrice}</Text>
              <Text style={styles.salePrice}>{offer.salePrice}</Text>
            </View>
          )}
        </View>
        
        {timeRemaining && !isExpired && (
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={14} color={colors.warning} />
            <Text style={styles.timer}>{timeRemaining}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}