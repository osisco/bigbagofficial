
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useColors, useCommonStyles, spacing, typography,  borderRadius } from '../../styles/commonStyles';
import { ShopRequest, Shop, Category, Country } from '../../types';
import { managementApi, shopsApi, categoriesApi, countriesApi, handleApiError } from '../../services/api';

const ManageShopsScreen = () => {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  
  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginVertical: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginVertical: spacing.md,
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  shopCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shopLogo: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  shopLocation: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  pendingBadge: {
    backgroundColor: colors.warning + '20',
  },
  approvedBadge: {
    backgroundColor: colors.success + '20',
  },
  rejectedBadge: {
    backgroundColor: colors.error + '20',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pendingText: {
    color: colors.warning,
  },
  approvedText: {
    color: colors.success,
  },
  rejectedText: {
    color: colors.error,
  },
  cardDetails: {
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 80,
  },
  detailValue: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  approveButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  });

  const { user, isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'shops'>('requests');
  const [shopRequests, setShopRequests] = useState<ShopRequest[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    console.log('Loading shop management data...');
    try {
      // Load shop requests
      const requestsResponse = await managementApi.getShopRequests();
      const requests = requestsResponse.success ? requestsResponse.data : [];
      
      // Load shops
      const shopsResponse = await shopsApi.getAll();
      const allShops = shopsResponse.success ? shopsResponse.data : [];
      
      // Load categories
      const categoriesResponse = await categoriesApi.getAll();
      const allCategories = categoriesResponse.success ? categoriesResponse.data : [];
      
      // Load countries
      const countriesResponse = await countriesApi.getAll();
      const allCountries = countriesResponse.success ? countriesResponse.data : [];
      
      setShopRequests(requests || []);
      setShops(allShops || []);
      setCategories(allCategories || []);
      setCountries(allCountries || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  }, []);

  useEffect(() => {
    console.log('ManageShopsScreen: Checking admin access');
    console.log('User:', user);
    console.log('isAdmin():', isAdmin());
    console.log('isLoading:', isLoading);
    
    // Wait for auth to finish loading
    if (isLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    
    if (!isAdmin()) {
      console.log('Access denied - user is not admin');
      Alert.alert('Access Denied', 'You do not have permission to access this page');
      router.back();
      return;
    }
    
    console.log('Admin access granted, loading data');
    loadData();
  }, [isAdmin, loadData, user, isLoading]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleBack = () => {
    router.back();
  };

  const handleApproveRequest = async (requestId: string) => {
    Alert.alert(
      'Approve Shop Request',
      'Are you sure you want to approve this shop request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const response = await managementApi.approveShopRequest(requestId);
              if (response.success) {
                Alert.alert('Success', 'Shop request approved successfully');
                await loadData();
              } else {
                Alert.alert('Error', response.message || 'Failed to approve shop request');
              }
            } catch (error) {
              console.error('Error approving shop:', error);
              Alert.alert('Error', handleApiError(error));
            }
          }
        }
      ]
    );
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.prompt(
      'Reject Shop Request',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async (reason) => {
            if (!reason?.trim()) {
              Alert.alert('Error', 'Please provide a reason for rejection');
              return;
            }
            try {
              const response = await managementApi.rejectShopRequest(requestId, reason);
              if (response.success) {
                Alert.alert('Success', 'Shop request rejected');
                await loadData();
              } else {
                Alert.alert('Error', response.message || 'Failed to reject shop request');
              }
            } catch (error) {
              console.error('Error rejecting shop:', error);
              Alert.alert('Error', handleApiError(error));
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleEditShop = (shopId: string) => {
    Alert.alert('Coming Soon', 'Shop editing functionality will be available soon');
  };

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    Alert.alert(
      'Delete Shop',
      `Are you sure you want to delete "${shopName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await shopsApi.delete(shopId);
              if (response.success) {
                Alert.alert('Success', 'Shop deleted successfully');
                await loadData();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete shop');
              }
            } catch (error) {
              console.error('Error deleting shop:', error);
              Alert.alert('Error', handleApiError(error));
            }
          }
        }
      ]
    );
  };

  const renderShopRequest = (request: ShopRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: request.logo }} style={styles.shopLogo} />
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{request.name}</Text>
          <Text style={styles.shopLocation}>{request.location}</Text>
        </View>
        <View style={[styles.statusBadge, styles.pendingBadge]}>
          <Text style={[styles.statusText, styles.pendingText]}>Pending</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>
            {categories.find(c => c.id === request.category)?.name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Country:</Text>
          <Text style={styles.detailValue}>
            {countries.find(c => c.code === request.country)?.name || request.country}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>City:</Text>
          <Text style={styles.detailValue}>{request.city}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Submitted:</Text>
          <Text style={styles.detailValue}>
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.approveButton} 
          onPress={() => handleApproveRequest(request.id)}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectButton} 
          onPress={() => handleRejectRequest(request.id)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderShop = (shop: Shop) => (
    <View key={shop.id} style={styles.shopCard}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: shop.logo }} style={styles.shopLogo} />
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopLocation}>{shop.location}</Text>
        </View>
        <View style={[styles.statusBadge, styles.approvedBadge]}>
          <Text style={[styles.statusText, styles.approvedText]}>Active</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>
            {categories.find(c => c.id === shop.category)?.name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Rating:</Text>
          <Text style={styles.detailValue}>
            {shop.rating.toFixed(1)} ⭐ ({shop.reviewCount} reviews)
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Countries:</Text>
          <Text style={styles.detailValue}>
            {shop.supportedCountries.join(', ')}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => handleEditShop(shop.id)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => handleDeleteShop(shop.id, shop.name)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = (type: 'requests' | 'shops') => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={type === 'requests' ? 'document-outline' : 'storefront-outline'} 
        size={64} 
        color={colors.textSecondary} 
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {type === 'requests' ? 'No Pending Requests' : 'No Active Shops'}
      </Text>
      <Text style={styles.emptyDescription}>
        {type === 'requests' 
          ? 'All shop requests have been processed' 
          : 'No shops are currently active in the system'
        }
      </Text>
    </View>
  );

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={commonStyles.centerContent}>
          <Text style={styles.emptyTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Shops</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests ({shopRequests.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'shops' && styles.activeTab]}
            onPress={() => setActiveTab('shops')}
          >
            <Text style={[styles.tabText, activeTab === 'shops' && styles.activeTabText]}>
              Active Shops ({shops.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'requests' ? (
            <>
              <Text style={styles.sectionTitle}>Pending Shop Requests</Text>
              {shopRequests.length > 0 ? (
                shopRequests.map(renderShopRequest)
              ) : (
                renderEmptyState('requests')
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Active Shops</Text>
              {shops.length > 0 ? (
                shops.map(renderShop)
              ) : (
                renderEmptyState('shops')
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ManageShopsScreen;