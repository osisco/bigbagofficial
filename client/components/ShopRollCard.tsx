import React, { memo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors, spacing, typography, borderRadius } from '../styles/commonStyles';
import { Roll } from '../types';
import { rollsApi } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - spacing.md * 3) / 2;

interface ShopRollCardProps {
  roll: Roll;
  onPress?: (rollId: string) => void;
}

const ShopRollCard = memo(({ roll, onPress }: ShopRollCardProps) => {
  if (!roll || !roll.videoUrl) return null;
  
  const colors = useColors();
  const [localRoll, setLocalRoll] = useState(roll);

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      marginBottom: spacing.sm,
    },
    videoContainer: {
      width: '100%',
      height: 160,
      backgroundColor: colors.backgroundAlt,
      position: 'relative',
    },
    video: {
      width: '100%',
      height: '100%',
    },
    playOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    playButton: {
      borderRadius: borderRadius.round,
      padding: spacing.md,
    },
    durationBadge: {
      position: 'absolute',
      bottom: spacing.xs,
      right: spacing.xs,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
    },
    durationText: {
      ...typography.small,
      color: 'white',
      fontWeight: '600',
    },
    content: {
      padding: spacing.sm,
    },
    caption: {
      ...typography.caption,
      color: colors.text,
      marginBottom: spacing.xs,
      lineHeight: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statText: {
      ...typography.small,
      color: colors.textSecondary,
      marginLeft: 2,
      fontWeight: '500',
    },
    categoryBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      alignSelf: 'flex-start',
    },
    categoryText: {
      ...typography.small,
      color: colors.primary,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    shopInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    shopLogo: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: spacing.xs,
    },
    shopName: {
      ...typography.small,
      color: colors.textSecondary,
      flex: 1,
    },
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `0:${secs.toString().padStart(2, '0')}`;
  };

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(localRoll.id);
    } else {
      router.push(`/roll-fullscreen/${localRoll.id}`);
    }
  }, [localRoll.id, onPress]);

  const handleLike = useCallback(async (e: any) => {
    e.stopPropagation();
    try {
      const response = await rollsApi.like(localRoll.id);
      if (response.success && response.data) {
        setLocalRoll(prev => ({
          ...prev,
          likes: response.data.likesCount,
          isLiked: response.data.isLiked
        }));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  }, [localRoll.id]);

  const handleSave = useCallback(async (e: any) => {
    e.stopPropagation();
    try {
      const response = await rollsApi.save(localRoll.id);
      if (response.success && response.data) {
        setLocalRoll(prev => ({
          ...prev,
          saves: response.data.savesCount,
          isSaved: response.data.isSaved
        }));
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  }, [localRoll.id]);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.videoContainer}>
        <Image
          source={{ uri: localRoll.shopLogo }}
          style={styles.video}
          resizeMode="cover"
        />
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={24} color={colors.text} />
          </View>
        </View>
        
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {formatDuration(localRoll.duration || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {localRoll.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {localRoll.caption}
          </Text>
        )}

        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem} onPress={handleLike}>
            <Ionicons 
              name={localRoll.isLiked ? "heart" : "heart-outline"} 
              size={14} 
              color={localRoll.isLiked ? colors.error : colors.textSecondary} 
            />
            <Text style={styles.statText}>{formatNumber(localRoll.likes || 0)}</Text>
          </TouchableOpacity>

          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.statText}>{formatNumber(localRoll.commentsCount || 0)}</Text>
          </View>

          <TouchableOpacity style={styles.statItem} onPress={handleSave}>
            <Ionicons 
              name={localRoll.isSaved ? "bookmark" : "bookmark-outline"} 
              size={12} 
              color={localRoll.isSaved ? colors.primary : colors.textSecondary} 
            />
            <Text style={styles.statText}>{formatNumber(localRoll.saves || localRoll.savesCount || 0)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{localRoll.category}</Text>
        </View>

        <View style={styles.shopInfo}>
          <Image source={{ uri: localRoll.shopLogo }} style={styles.shopLogo} />
          <Text style={styles.shopName} numberOfLines={1}>
            {localRoll.shopName}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

ShopRollCard.displayName = 'ShopRollCard';

export default ShopRollCard;