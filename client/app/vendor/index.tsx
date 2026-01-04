import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../../styles/commonStyles';
import { useAuth } from '../../hooks/useAuth';

export default function VendorDashboard() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { user, vendorProfile } = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      ...typography.h1,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginVertical: spacing.lg,
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      ...typography.h2,
      color: colors.primary,
      fontWeight: 'bold',
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    menuContainer: {
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      ...typography.h4,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    menuDescription: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  });

  const menuItems = [
    {
      title: 'Create Shop Request',
      description: 'Submit a new shop for approval',
      icon: 'storefront-outline',
      route: '/vendor/create-shop',
      color: colors.primary,
    },
    {
      title: 'Upload Roll',
      description: 'Create video content for your shop',
      icon: 'videocam-outline',
      route: '/upload-roll',
      color: colors.accent,
    },
    {
      title: 'Create Coupon',
      description: 'Add discount coupons for customers',
      icon: 'ticket-outline',
      route: '/vendor/create-coupon',
      color: colors.success,
    },
    {
      title: 'Create Offer',
      description: 'Promote special deals and offers',
      icon: 'pricetag-outline',
      route: '/vendor/create-offer',
      color: colors.warning,
    },
    {
      title: 'Roll Packages',
      description: 'Purchase roll upload credits',
      icon: 'card-outline',
      route: '/vendor/roll-packages',
      color: colors.info,
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendor Dashboard</Text>
        <Text style={styles.subtitle}>Manage your business content</Text>
      </View>

      <ScrollView style={styles.content}>
        {vendorProfile && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vendorProfile.availableRolls}</Text>
              <Text style={styles.statLabel}>Available Rolls</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vendorProfile.totalRollsUsed}</Text>
              <Text style={styles.statLabel}>Rolls Used</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vendorProfile.shopId ? '1' : '0'}</Text>
              <Text style={styles.statLabel}>Active Shops</Text>
            </View>
          </View>
        )}

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

