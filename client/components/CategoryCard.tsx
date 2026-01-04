import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, borderRadius, typography } from '../styles/commonStyles';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onPress?: () => void;
}

export default function CategoryCard({ category, onPress }: CategoryCardProps) {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
      flex: 1,
      marginHorizontal: spacing.xs,
      marginVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
      justifyContent: 'center',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.round,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    name: {
      ...typography.caption,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '500',
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
        <Ionicons name={category.icon as any} size={24} color={colors.white} />
      </View>
      <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
    </TouchableOpacity>
  );
}
