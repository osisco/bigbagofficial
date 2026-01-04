import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../../styles/commonStyles';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboard() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Create Shop',
      description: 'Create shops directly without approval',
      icon: 'add-circle-outline',
      route: '/admin/create-shop',
      color: colors.primary,
    },
    {
      title: 'Manage Shops',
      description: 'Review and approve shop requests',
      icon: 'storefront-outline',
      route: '/admin/manage-shops',
      color: colors.primary,
    },
    {
      title: 'Manage Categories',
      description: 'Add and edit shop categories',
      icon: 'grid-outline',
      route: '/admin/manage-categories',
      color: colors.accent,
    },
    {
      title: 'Manage Ads',
      description: 'Create and manage advertisements',
      icon: 'megaphone-outline',
      route: '/admin/manage-ads',
      color: colors.warning,
    },
    {
      title: 'Manage Coupons',
      description: 'View and manage all coupons',
      icon: 'ticket-outline',
      route: '/admin/manage-coupons',
      color: colors.success,
    },
    {
      title: 'Manage Offers',
      description: 'View and manage all offers',
      icon: 'pricetag-outline',
      route: '/admin/manage-offers',
      color: colors.info,
    },
    {
      title: 'Create Coupon',
      description: 'Add new discount coupons',
      icon: 'add-circle-outline',
      route: '/vendor/create-coupon',
      color: colors.success,
    },
    {
      title: 'Create Offer',
      description: 'Add new promotional offers',
      icon: 'add-circle-outline',
      route: '/vendor/create-offer',
      color: colors.info,
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Ionicons name="shield-outline" size={64} color={colors.error} />
          <Text style={styles.accessDeniedText}>Admin Access Required</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage platform content and users</Text>
      </View>

      <ScrollView style={styles.content}>
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

