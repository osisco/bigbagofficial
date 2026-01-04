import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../../styles/commonStyles';
import { useAuth } from '../../hooks/useAuth';
import { offersApi, shopsApi, handleApiError } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateOfferScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { user, vendorProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userShops, setUserShops] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    shop: '',
    title: '',
    description: '',
    discount: '',
    originalPrice: '',
    salePrice: '',
    image: '',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isLimited: false,
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
    imageButton: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      aspectRatio: 16/9,
    },
    selectedImage: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
    },
    imagePlaceholderText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    halfWidth: {
      flex: 1,
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
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxLabel: {
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
      const response = await shopsApi.getAll();
      if (response.success && response.data) {
        let filteredShops;
        if (user?.role === 'admin') {
          // Admins see all shops
          filteredShops = response.data;
        } else {
          // Vendors only see their own shop
          filteredShops = response.data.filter(shop => shop.vendorId === user?.id);
        }
        
        setUserShops(filteredShops);
        
        // Auto-select the first (and likely only) shop
        if (filteredShops.length === 1) {
          setFormData(prev => ({ ...prev, shop: filteredShops[0].id }));
        }
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, expiryDate: selectedDate }));
    }
  };

  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, image: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const isFormValid = () => {
    return formData.shop && formData.title.trim() && formData.description.trim() && 
           formData.discount.trim() && formData.image;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all required fields and select an image');
      return;
    }

    setIsLoading(true);
    try {
      // Create FormData for image upload
      const offerFormData = new FormData();
      offerFormData.append('shop', formData.shop);
      offerFormData.append('title', formData.title.trim());
      offerFormData.append('description', formData.description.trim());
      offerFormData.append('discount', formData.discount.trim());
      offerFormData.append('originalPrice', formData.originalPrice.trim());
      offerFormData.append('salePrice', formData.salePrice.trim());
      offerFormData.append('expiryDate', formData.expiryDate.toISOString());
      offerFormData.append('isLimited', formData.isLimited.toString());

      // Add image file
      if (formData.image) {
        offerFormData.append('image', {
          uri: formData.image,
          type: 'image/jpeg',
          name: `offer_${Date.now()}.jpg`,
        } as any);
      }

      const response = await offersApi.create(offerFormData);
      
      if (response.success) {
        Alert.alert('Success', 'Offer created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create offer');
      }
    } catch (error) {
      console.error('Error creating offer:', error);
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
        <Text style={styles.title}>Create Offer</Text>
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollContent}>
          {/* Shop Info Display */}
          {userShops.length > 0 && (
            <View style={styles.shopInfoContainer}>
              <Text style={styles.shopInfoTitle}>Your Shop</Text>
              <View style={styles.shopInfoCard}>
                <Text style={styles.shopInfoName}>{userShops[0].name}</Text>
                <Text style={styles.shopInfoSubtext}>Creating offer for this shop</Text>
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
            <Text style={styles.label}>Offer Image <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
              {formData.image ? (
                <Image source={{ uri: formData.image }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                  <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder="e.g., Flash Sale - 50% Off All Items"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Describe the offer details..."
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
              placeholder="e.g., 50% OFF, $25 OFF, Buy 2 Get 1 Free"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Original Price</Text>
              <TextInput
                style={styles.input}
                value={formData.originalPrice}
                onChangeText={(value) => handleInputChange('originalPrice', value)}
                placeholder="$99.99"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Sale Price</Text>
              <TextInput
                style={styles.input}
                value={formData.salePrice}
                onChangeText={(value) => handleInputChange('salePrice', value)}
                placeholder="$49.99"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
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

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleInputChange('isLimited', !formData.isLimited)}
            >
              <View style={[styles.checkbox, formData.isLimited && styles.checkboxChecked]}>
                {formData.isLimited && (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Limited Time Offer</Text>
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
              {isLoading ? 'Creating...' : 'Create Offer'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

