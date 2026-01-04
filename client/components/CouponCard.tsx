import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, useCommonStyles, spacing, borderRadius, typography } from '../styles/commonStyles';
import { Coupon } from '../types';
import { couponsApi } from '../services/api';
import * as Clipboard from 'expo-clipboard';

interface CouponCardProps {
  coupon: Coupon;
  onPress?: () => void;
  onDelete?: (couponId: string) => void;
  shopOwnerId?: string; // Add shop owner ID
}

export default function CouponCard({ coupon, onPress, onDelete, shopOwnerId }: CouponCardProps) {
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
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginVertical: spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      alignSelf: 'center',
      width: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    shopInfo: {
      flex: 1,
    },
    shopName: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    discount: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
    },
    codeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    code: {
      ...typography.caption,
      color: colors.white,
      fontWeight: '700',
      marginRight: spacing.xs,
    },
    copyButton: {
      padding: spacing.xs,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    expiryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    expiry: {
      ...typography.small,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    expiringSoon: {
      color: colors.warning,
      fontWeight: '600',
    },
    urgentBadge: {
      backgroundColor: colors.warning,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    urgentText: {
      ...typography.small,
      color: colors.white,
      fontWeight: '600',
    },
    actionHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionText: {
      ...typography.small,
      color: colors.primary,
      marginLeft: spacing.xs,
      fontWeight: '500',
    },
    deleteButton: {
      position: 'absolute',
      bottom: spacing.sm,
      right: spacing.sm,
      backgroundColor: colors.error,
      borderRadius: borderRadius.sm,
      padding: spacing.xs,
    },
  });

  const handleCopyCode = async (e?: any) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      await Clipboard.setStringAsync(coupon.code);
      Alert.alert('Copied!', `Coupon code "${coupon.code}" copied to clipboard`);
    } catch (error) {
      console.log('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy coupon code');
    }
  };

  const handleDelete = async (e: any) => {
    e.stopPropagation();
    Alert.alert(
      "Delete Coupon",
      "Are you sure you want to delete this coupon?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const res = await couponsApi.delete(coupon.id);
              if (res.success) {
                onDelete?.(coupon.id);
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete coupon');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const isExpiringSoon = () => {
    const expiryDate = new Date(coupon.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {canDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="trash-outline" size={16} color={colors.white} />
          )}
        </TouchableOpacity>
      )}
      <View style={styles.header}>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{coupon.shopName}</Text>
          <Text style={styles.discount}>{coupon.discount} OFF</Text>
        </View>
        <View style={styles.codeContainer}>
          <Text style={styles.code}>{coupon.code}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Ionicons name="copy-outline" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.description}>{coupon.description}</Text>
      
      <View style={styles.footer}>
        <View style={styles.expiryContainer}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.expiry, isExpiringSoon() && styles.expiringSoon]}>
            Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
          </Text>
        </View>
        {isExpiringSoon() && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>Expires Soon!</Text>
          </View>
        )}
      </View>

      <View style={styles.actionHint}>
        <Ionicons name="touch-outline" size={16} color={colors.primary} />
        <Text style={styles.actionText}>Tap to copy code & visit store</Text>
      </View>
    </TouchableOpacity>
  );
}