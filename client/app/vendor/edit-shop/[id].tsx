import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../../../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { categoriesApi, shopsApi, handleApiError } from '../../../services/api';
import { Category, Shop } from '../../../types';
import CountryPicker from '../../../components/CountryPicker';
import LanguagePicker from '../../../components/LanguagePicker';
import { COUNTRIES, Country } from '../../../constants/countries';
import { Language } from '../../../constants/languages';
import { useAuth } from '../../../hooks/useAuth';

export default function EditShopScreen() {
  const colors = useColors();
  const { user, isVendor, authState } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | undefined>();
  const [selectedSupportedCountries, setSelectedSupportedCountries] = useState<Country[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    description: '',
    link: '',
    location: '',
    city: '',
    country: '',
    language: '',
    category: '',
    supportedCountries: [] as string[],
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
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    formGroup: {
      marginBottom: spacing.md,
    },
    label: {
      ...typography.body,
      color: colors.text,
      marginBottom: spacing.sm,
      fontWeight: '500',
    },
    required: {
      color: colors.error,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.body,
      color: colors.text,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    logoButton: {
      width: 120,
      height: 120,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    logoImage: {
      width: 120,
      height: 120,
      borderRadius: borderRadius.lg,
    },
    logoText: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
    },
    selectedCategory: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    categoryIcon: {
      marginRight: spacing.sm,
    },
    categoryName: {
      ...typography.body,
      color: colors.text,
    },
    selectedCategoryName: {
      color: colors.primary,
      fontWeight: '600',
    },
    countryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.surface,
    },
    selectedCountry: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    countryFlag: {
      fontSize: 16,
      marginRight: spacing.xs,
    },
    countryCode: {
      ...typography.caption,
      color: colors.text,
    },
    selectedCountryCode: {
      color: colors.primary,
      fontWeight: '600',
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.xxl * 2,
    },
    submitButtonDisabled: {
      backgroundColor: colors.textSecondary,
    },
    submitButtonText: {
      ...typography.button,
      color: colors.white,
    },
  });

  useEffect(() => {
    if (authState.isLoading) {
      return; // Wait for auth to load
    }
    
    if (!isVendor() || !id) {
      Alert.alert('Access Denied', 'You do not have permission to edit this shop');
      router.back();
      return;
    }
    loadData();
  }, [id, authState.isLoading, isVendor]);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      
      const categoriesResponse = await categoriesApi.getAll();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      const shopResponse = await shopsApi.getById(id);
      if (shopResponse.success && shopResponse.data) {
        const shopData = shopResponse.data;
        
        const shopVendorId = shopData.vendorId?._id || shopData.vendorId?.id || shopData.vendorId;
        if (shopVendorId !== user?.id) {
          Alert.alert('Access Denied', 'You can only edit your own shop');
          router.back();
          return;
        }

        setShop(shopData);
        setFormData({
          name: shopData.name || '',
          logo: shopData.logo || '',
          description: shopData.description || '',
          link: shopData.link || '',
          location: shopData.location || '',
          city: shopData.city || '',
          country: shopData.country || '',
          language: shopData.language || '',
          category: shopData.category || '',
          supportedCountries: shopData.supportedCountries || [],
        });

        const country = COUNTRIES.find(c => c.name === shopData.country);
        if (country) setSelectedCountry(country);

        const supportedCountries = COUNTRIES.filter(c => 
          shopData.supportedCountries?.includes(c.code)
        );
        setSelectedSupportedCountries(supportedCountries);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load shop data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (categoryId: string) => {
    setFormData(prev => ({ ...prev, category: categoryId }));
  };

  const handleSupportedCountryToggle = (country: Country) => {
    const isSelected = selectedSupportedCountries.some(c => c.code === country.code);
    if (isSelected) {
      setSelectedSupportedCountries(prev => prev.filter(c => c.code !== country.code));
      setFormData(prev => ({
        ...prev,
        supportedCountries: prev.supportedCountries.filter(c => c !== country.code)
      }));
    } else {
      setSelectedSupportedCountries(prev => [...prev, country]);
      setFormData(prev => ({
        ...prev,
        supportedCountries: [...prev.supportedCountries, country.code]
      }));
    }
  };

  const selectLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, logo: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select logo');
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.logo &&
      formData.description.trim() &&
      formData.link.trim() &&
      formData.location.trim() &&
      formData.city.trim() &&
      selectedCountry &&
      formData.category &&
      formData.supportedCountries.length > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const shopFormData = new FormData();
      shopFormData.append('name', formData.name);
      shopFormData.append('description', formData.description);
      shopFormData.append('link', formData.link);
      shopFormData.append('location', formData.location);
      shopFormData.append('country', selectedCountry?.name || formData.country);
      shopFormData.append('city', formData.city);
      shopFormData.append('language', selectedLanguage?.code || formData.language);
      shopFormData.append('category', formData.category);
      shopFormData.append('supportedCountries', JSON.stringify(formData.supportedCountries));

      if (formData.logo && formData.logo !== shop?.logo) {
        shopFormData.append('logo', {
          uri: formData.logo,
          type: 'image/jpeg',
          name: `shop_logo_${Date.now()}.jpg`,
        } as any);
      }

      const response = await shopsApi.update(id, shopFormData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Shop updated successfully',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to update shop');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Shop</Text>
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Shop</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Logo <Text style={styles.required}>*</Text></Text>
            <View style={styles.logoContainer}>
              <TouchableOpacity style={styles.logoButton} onPress={selectLogo}>
                {formData.logo ? (
                  <Image source={{ uri: formData.logo }} style={styles.logoImage} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                    <Text style={styles.logoText}>Tap to change logo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Shop Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Enter your shop name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Describe your shop and what you offer"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Shop Website/Link <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formData.link}
                onChangeText={(text) => handleInputChange('link', text)}
                placeholder="https://yourshop.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Address <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="Enter complete address"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholder="Enter city name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category <Text style={styles.required}>*</Text></Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => {
                const isSelected = formData.category === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.selectedCategory,
                    ]}
                    onPress={() => handleCategorySelect(category.id)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={24}
                      color={isSelected ? colors.primary : category.color}
                      style={styles.categoryIcon}
                    />
                    <Text
                      style={[
                        styles.categoryName,
                        isSelected && styles.selectedCategoryName,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary Country <Text style={styles.required}>*</Text></Text>
            <CountryPicker
              selectedCountry={selectedCountry}
              onSelect={(country) => {
                setSelectedCountry(country);
                setFormData(prev => ({ ...prev, country: country.name }));
              }}
              placeholder="Select primary country"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary Language</Text>
            <LanguagePicker
              selectedLanguage={selectedLanguage}
              onSelect={(language) => {
                setSelectedLanguage(language);
                setFormData(prev => ({ ...prev, language: language.code }));
              }}
              placeholder="Select primary language"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supported Countries <Text style={styles.required}>*</Text></Text>
            <Text style={[styles.logoText, { marginBottom: spacing.md }]}>
              Select all countries where your shop ships to ({selectedSupportedCountries.length} selected)
            </Text>
            <View style={styles.countryGrid}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={`supported-${country.code}`}
                  style={[
                    styles.countryItem,
                    selectedSupportedCountries.some(c => c.code === country.code) && styles.selectedCountry,
                  ]}
                  onPress={() => handleSupportedCountryToggle(country)}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text
                    style={[
                      styles.countryCode,
                      selectedSupportedCountries.some(c => c.code === country.code) && styles.selectedCountryCode,
                    ]}
                  >
                    {country.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Updating...' : 'Update Shop'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}