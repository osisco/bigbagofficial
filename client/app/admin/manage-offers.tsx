import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../../styles/commonStyles';
import { useAuth } from '../../hooks/useAuth';
import { offersApi, handleApiError } from '../../services/api';

export default function ManageOffersScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Admin access required', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }
    loadOffers();
  }, [user]);

  const loadOffers = async () => {
    try {
      const response = await offersApi.getAll();
      if (response.success && response.data) {
        setOffers(response.data);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
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
    loadOffers();
  };

  const handleDeleteOffer = (offerId: string) => {
    Alert.alert(
      'Delete Offer',
      'Are you sure you want to delete this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await offersApi.delete(offerId);
              if (response.success) {
                setOffers(prev => prev.filter(offer => offer.id !== offerId));
                Alert.alert('Success', 'Offer deleted successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete offer');
              }
            } catch (error) {
              Alert.alert('Error', handleApiError(error));
            }
          }
        }
      ]
    );
  };

  const getTimeRemaining = (expiryDate: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h left`;
    } else {
      return `${diffHours}h left`;
    }
  };

  const renderOfferItem = ({ item }) => {
    const timeRemaining = getTimeRemaining(item.expiryDate);
    const isExpired = timeRemaining === 'Expired';

    return (
      <View style={[styles.offerItem, isExpired && styles.expiredOffer]}>
        <View style={styles.offerHeader}>
          <Image source={{ uri: item.image }} style={styles.offerImage} />
          <View style={styles.offerInfo}>
            <Text style={styles.offerTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.offerShop}>{item.shopName}</Text>
            <Text style={styles.offerDiscount}>{item.discount}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteOffer(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.offerDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        {(item.originalPrice || item.salePrice) && (
          <View style={styles.priceContainer}>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>{item.originalPrice}</Text>
            )}
            {item.salePrice && (
              <Text style={styles.salePrice}>{item.salePrice}</Text>
            )}
          </View>
        )}
        
        <View style={styles.offerFooter}>
          {timeRemaining && (
            <Text style={[
              styles.timeRemaining,
              { color: isExpired ? colors.error : colors.warning }
            ]}>
              {timeRemaining}
            </Text>
          )}
          
          <View style={styles.badges}>
            {item.isLimited && (
              <View style={styles.limitedBadge}>
                <Text style={styles.limitedText}>Limited</Text>
              </View>
            )}
            <View style={[
              styles.statusBadge,
              { backgroundColor: isExpired ? colors.error + '20' : colors.success + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: isExpired ? colors.error : colors.success }
              ]}>
                {isExpired ? 'Expired' : 'Active'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Offers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/vendor/create-offer')}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={offers}
        renderItem={renderOfferItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No offers found</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/vendor/create-offer')}
            >
              <Text style={styles.createButtonText}>Create First Offer</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

