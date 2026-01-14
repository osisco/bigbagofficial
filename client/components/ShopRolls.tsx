import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors, spacing, typography, borderRadius } from '../styles/commonStyles';
import { rollsApi, handleApiError } from '../services/api';
import { Roll } from '../types';
import ShopRollCard from './ShopRollCard';

const { width: screenWidth } = Dimensions.get('window');

interface ShopRollsProps {
  shopId: string;
  nested?: boolean; // If true, render without FlatList to avoid nesting in ScrollView
}

export default function ShopRolls({ shopId, nested = false }: ShopRollsProps) {
  const colors = useColors();
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl,
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
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyIcon: {
      marginBottom: spacing.md,
    },
    emptyTitle: {
      ...typography.h4,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    emptySubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    rollsList: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
    },
    nestedRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    nestedItem: {
      width: '48%',
    },
  });

  useEffect(() => {
    loadShopRolls();
  }, [shopId]);

  const loadShopRolls = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Loading rolls for shop:', shopId);
      
      const response = await rollsApi.getByShop(shopId);
      
      if (response.success && response.data) {
        setRolls(response.data);
        console.log(`Found ${response.data.length} rolls for shop ${shopId}`);
      } else {
        setError(response.message || 'Failed to load rolls');
      }
    } catch (err) {
      console.error('Error loading shop rolls:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRollCard = ({ item: roll }: { item: Roll }) => (
    <ShopRollCard roll={roll} />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading rolls...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (rolls.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="videocam-outline" size={64} color={colors.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>No Rolls Yet</Text>
        <Text style={styles.emptySubtitle}>
          This shop hasn't posted any rolls yet.{'\n'}
          Check back later for exciting content!
        </Text>
      </View>
    );
  }

  // If nested in ScrollView, render items directly without FlatList
  if (nested) {
    const rows = [];
    for (let i = 0; i < rolls.length; i += 2) {
      rows.push(
        <View key={`row-${i}`} style={styles.nestedRow}>
          <View style={styles.nestedItem}>
            {renderRollCard({ item: rolls[i] })}
          </View>
          {rolls[i + 1] && (
            <View style={styles.nestedItem}>
              {renderRollCard({ item: rolls[i + 1] })}
            </View>
          )}
        </View>
      );
    }
    return (
      <View style={[styles.container, styles.rollsList]}>
        {rows}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rolls}
        renderItem={renderRollCard}
        keyExtractor={(item, index) => item.id || `roll-${index}`}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.rollsList}
      />
    </View>
  );
}