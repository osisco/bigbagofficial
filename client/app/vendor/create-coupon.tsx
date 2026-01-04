import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../../styles/commonStyles';
import { useAuth } from '../../hooks/useAuth';
import { couponsApi, shopsApi, handleApiError } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateCouponScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { user, vendorProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userShops, setUserShops] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    shop: '',
    code: '',
    description: '',
    discount: '',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });

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
      padding: spacing.sm,
      marginRight: spacing.sm,
    },
    title: {
      ...typography.h2,
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    inputContainer: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.bodyBold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    required: {
      color: colors.error,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      ...typography.body,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    pickerContainer: {
      gap: spacing.sm,
    },
    shopOption: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectedShopOption: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    vendorShopOption: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    shopOptionContent: {
      flex: 1,
    },
    shopOptionText: {
      ...typography.body,
      color: colors.text,
    },
    selectedShopOptionText: {
      color: colors.primary,
      fontWeight: '600',
    },
    vendorShopText: {
      fontWeight: '600',
    },
    vendorShopLabel: {
      ...typography.caption,
      color: colors.primary,
      marginTop: spacing.xs,
    },
    dateButton: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateButtonText: {
      ...typography.body,
      color: colors.text,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    submitButtonDisabled: {
      backgroundColor: colors.border,
    },
    submitButtonText: {
      ...typography.button,
      color: colors.white,
    },
    shopInfoContainer: {
      marginBottom: spacing.lg,
    },
    shopInfoTitle: {
      ...typography.bodyBold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    shopInfoCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    shopInfoName: {
      ...typography.h3,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    shopInfoSubtext: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  });

  useEffect(() => {
    if (user && user.role) {
      loadUserShops();
    }
  }, [user]);

  const loadUserShops = async () => {
    try {
      console.log('=== SHOP LOADING DEBUG ===');
      console.log('User object:', user);
      console.log('User ID:', user?.id, 'type:', typeof user?.id);
      console.log('User _id:', user?._id, 'type:', typeof user?._id);
      console.log('User role:', user?.role);
      console.log('Vendor profile:', vendorProfile);
      
      const response = await shopsApi.getAll();
      console.log('All shops response:', response);
      
      if (response.success && response.data) {
        console.log('Raw shops data:', response.data);
        
        let filteredShops;
        if (user?.role === 'admin') {
          filteredShops = response.data;
        } else {
          const userId = user?.id || user?._id;
          console.log('Using userId for filtering:', userId, 'type:', typeof userId);
          
          filteredShops = response.data.filter(shop => {
            console.log('Shop:', shop.name);
            console.log('  - shop.vendorId:', shop.vendorId, 'type:', typeof shop.vendorId);
            console.log('  - userId:', userId, 'type:', typeof userId);
            console.log('  - Match:', shop.vendorId === userId);
            console.log('  - String match:', shop.vendorId?.toString() === userId?.toString());
            return shop.vendorId === userId || shop.vendorId?.toString() === userId?.toString();
          });
        }
        
        console.log('Filtered shops:', filteredShops);
        setUserShops(filteredShops);
        
        if (filteredShops.length === 1) {
          setFormData(prev => ({ ...prev, shop: filteredShops[0].id }));
        }
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, expiryDate: selectedDate }));
    }
  };

  const isFormValid = () => {
    return formData.shop && formData.code.trim() && formData.description.trim() && formData.discount.trim();
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const couponData = {
        shop: formData.shop,
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim(),
        discount: formData.discount.trim(),
        expiryDate: formData.expiryDate.toISOString(),
      };

      const response = await couponsApi.create(couponData);
      
      if (response.success) {
        Alert.alert('Success', 'Coupon created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create coupon');
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      Alert.alert('Error', handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Coupon</Text>
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollContent}>
          {/* Shop Info Display */}
          {userShops.length > 0 && (
            <View style={styles.shopInfoContainer}>
              <Text style={styles.shopInfoTitle}>Your Shop</Text>
              <View style={styles.shopInfoCard}>
                <Text style={styles.shopInfoName}>{userShops[0].name}</Text>
                <Text style={styles.shopInfoSubtext}>Creating coupon for this shop</Text>
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Shop <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              {userShops.map((shop, index) => {
                const isVendorShop = user?.role === 'vendor' && shop.vendorId === user?.id;
                return (
                  <TouchableOpacity
                    key={shop.id}
                    style={[
                      styles.shopOption,
                      formData.shop === shop.id && styles.selectedShopOption,
                      isVendorShop && styles.vendorShopOption
                    ]}
                    onPress={() => handleInputChange('shop', shop.id)}
                  >
                    <View style={styles.shopOptionContent}>
                      <Text style={[
                        styles.shopOptionText,
                        formData.shop === shop.id && styles.selectedShopOptionText,
                        isVendorShop && styles.vendorShopText
                      ]}>
                        {shop.name}
                      </Text>
                      {isVendorShop && (
                        <Text style={styles.vendorShopLabel}>Your Shop</Text>
                      )}
                    </View>
                    {isVendorShop && (
                      <Ionicons name="storefront" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Coupon Code <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.code}
              onChangeText={(value) => handleInputChange('code', value)}
              placeholder="e.g., SAVE20, WELCOME10"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              maxLength={20}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Describe what this coupon offers..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Discount <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.discount}
              onChangeText={(value) => handleInputChange('discount', value)}
              placeholder="e.g., 20% OFF, $10 OFF, Buy 1 Get 1"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Expiry Date <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formData.expiryDate.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.expiryDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid() || isLoading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Creating...' : 'Create Coupon'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

