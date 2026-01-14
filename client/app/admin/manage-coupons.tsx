import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../../styles/commonStyles';
import { useAuth } from '../../hooks/useAuth';
import { couponsApi, handleApiError } from '../../services/api';

export default function ManageCouponsScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Admin access required', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }
    loadCoupons();
  }, [user]);

  const loadCoupons = async () => {
    try {
      const response = await couponsApi.getAll();
      if (response.success && response.data) {
        setCoupons(response.data);
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      Alert.alert('Error', handleApiError(error));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
  const colors = useColors();
  const commonStyles = useCommonStyles();
    setRefreshing(true);
    loadCoupons();
  };

  const handleDeleteCoupon = (couponId: string) => {
    Alert.alert(
      'Delete Coupon',
      'Are you sure you want to delete this coupon?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await couponsApi.delete(couponId);
              if (response.success) {
                setCoupons(prev => prev.filter(coupon => coupon.id !== couponId));
                Alert.alert('Success', 'Coupon deleted successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete coupon');
              }
            } catch (error) {
              Alert.alert('Error', handleApiError(error));
            }
          }
        }
      ]
    );
  };

  const renderCouponItem = ({ item }) => (
    <View style={styles.couponItem}>
      <View style={styles.couponHeader}>
        <Text style={styles.couponCode}>{item.code}</Text>
        <View style={styles.couponActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteCoupon(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.couponShop}>{item.shopName}</Text>
      <Text style={styles.couponDescription}>{item.description}</Text>
      <Text style={styles.couponDiscount}>{item.discount}</Text>
      
      <View style={styles.couponFooter}>
        <Text style={styles.couponExpiry}>
          Expires: {new Date(item.expiryDate).toLocaleDateString()}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.isExpired ? colors.error + '20' : colors.success + '20' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.isExpired ? colors.error : colors.success }
          ]}>
            {item.isExpired ? 'Expired' : 'Active'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Coupons</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/vendor/create-coupon')}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={coupons}
        renderItem={renderCouponItem}
        keyExtractor={(item, index) => item.id || `coupon-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No coupons found</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/vendor/create-coupon')}
            >
              <Text style={styles.createButtonText}>Create First Coupon</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

