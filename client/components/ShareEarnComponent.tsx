import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../styles/commonStyles';
import { shareApi, handleApiError } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface ShareEarnProps {
  onReelsEarned?: (reelsEarned: number) => void;
}

interface ShareStats {
  availableRolls: number;
  totalShares: number;
  lastShareDate: string | null;
  canShareToday: boolean;
  nextShareAvailable: string | null;
}

const ShareEarnComponent: React.FC<ShareEarnProps> = ({ onReelsEarned }) => {
  const { isUser } = useAuth();
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [shareStats, setShareStats] = useState<ShareStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    headerText: {
      flex: 1,
    },
    title: {
      ...typography.h4,
      color: colors.text,
      fontWeight: '600',
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    content: {
      gap: spacing.md,
    },
    rewardInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success + '10',
      padding: spacing.sm,
      borderRadius: borderRadius.md,
    },
    rewardText: {
      ...typography.body,
      color: colors.success,
      fontWeight: '500',
      marginLeft: spacing.sm,
    },
    shareButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
    },
    shareButtonDisabled: {
      opacity: 0.6,
    },
    shareButtonText: {
      ...typography.button,
      color: colors.white,
      fontWeight: '600',
    },
    waitContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    waitText: {
      ...typography.body,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
    },
    securityNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    securityText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    loadingText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
  });

  useEffect(() => {
    loadShareStats();
  }, []);

  const loadShareStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await shareApi.getShareStats();
      if (response.success) {
        setShareStats(response.data);
      }
    } catch (error) {
      console.error('Error loading share stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const generateDeviceId = async (): Promise<string> => {
    try {
      // Try to get a unique device identifier
      const deviceId = await Application.getAndroidId();
      if (deviceId) return deviceId;
      
      // Fallback to device name + model
      const deviceName = Device.deviceName || 'unknown';
      const modelName = Device.modelName || 'unknown';
      return `${deviceName}-${modelName}-${Date.now()}`;
    } catch (error) {
      // Ultimate fallback
      return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  const handleShareApp = async () => {
    if (!shareStats?.canShareToday) {
      Alert.alert(
        'Already Shared Today',
        'You can only earn rolls once per day. Come back tomorrow!',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsLoading(true);

      // First, trigger the native share dialog
      const shareResult = await Share.share({
        message: 'Check out BigBag - the amazing shopping app with rolls, offers, and coupons! Download now and start exploring amazing deals.',
        title: 'BigBag - Shop with Rolls',
        url: Platform.OS === 'ios' ? 'https://apps.apple.com/bigbag' : 'https://play.google.com/store/apps/details?id=com.bigbag',
      });

      // Only proceed if user actually shared (not cancelled)
      if (shareResult.action === Share.sharedAction) {
        // Generate secure device ID
        const deviceId = await generateDeviceId();
        const platform = Platform.OS;

        // Record the share on backend
        const response = await shareApi.recordShare(deviceId, platform);
        
        if (response.success) {
          Alert.alert(
            '🎉 Congratulations!',
            `You earned ${response.data.reelsEarned} roll! Keep sharing to earn more rolls daily.`,
            [{ text: 'Awesome!' }]
          );
          
          // Refresh stats
          await loadShareStats();
          
          // Notify parent component
          if (onReelsEarned) {
            onReelsEarned(response.data.reelsEarned);
          }
        } else {
          Alert.alert('Error', response.message || 'Failed to record share');
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      const errorMessage = handleApiError(error);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeUntilNextShare = (nextShareDate: string): string => {
    const now = new Date();
    const next = new Date(nextShareDate);
    const diff = next.getTime() - now.getTime();
    
    if (diff <= 0) return 'Available now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoadingStats) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Don't render for regular users
  if (isUser()) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="share-social" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Share & Earn Rolls</Text>
          <Text style={styles.subtitle}>
            {shareStats?.availableRolls || 0} rolls available • {shareStats?.totalShares || 0} total shares
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.rewardInfo}>
          <Ionicons name="gift" size={20} color={colors.success} />
          <Text style={styles.rewardText}>Earn 1 roll per day by sharing</Text>
        </View>

        {shareStats?.canShareToday ? (
          <TouchableOpacity
            style={[styles.shareButton, isLoading && styles.shareButtonDisabled]}
            onPress={handleShareApp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color={colors.white} />
                <Text style={styles.shareButtonText}>Share App & Earn Roll</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.waitContainer}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.waitText}>
              Next share available in {shareStats?.nextShareAvailable ? 
                formatTimeUntilNextShare(shareStats.nextShareAvailable) : 'calculating...'}
            </Text>
          </View>
        )}

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.securityText}>
            Secured with anti-fraud protection
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ShareEarnComponent;