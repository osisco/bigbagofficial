import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { categoriesApi, vendorApi, handleApiError } from '../../services/api';
import { Category } from '../../types';
import CountryPicker from '../../components/CountryPicker';
import LanguagePicker from '../../components/LanguagePicker';
import { COUNTRIES, Country } from '../../constants/countries';
import { Language } from '../../constants/languages';

const CreateShopScreen = () => {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { user, vendorProfile } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingShopRequest, setExistingShopRequest] = useState<any>(null);
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
    infoBox: {
      backgroundColor: colors.primary + '10',
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    infoText: {
      ...typography.body,
      color: colors.text,
    },
  });

  useEffect(() => {
    loadCategories();
    checkExistingShopRequest();
    checkExistingShop();
  }, []);

  const checkExistingShop = async () => {
    try {
      if (vendorProfile?.shopId) {
        Alert.alert(
          'Shop Already Exists',
          'You already have an approved shop. Each vendor can only have one shop.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error checking existing shop:', error);
    }
  };

  const checkExistingShopRequest = async () => {
    try {
      const response = await vendorApi.getShopRequests();
      if (response.success && response.data && response.data.length > 0) {
        const pendingRequest = response.data.find((req: any) => req.status === 'pending');
        if (pendingRequest) {
          setExistingShopRequest(pendingRequest);
        }
      }
    } catch (error) {
      console.error('Error checking existing shop request:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleBack = () => {
    router.back();
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
      selectedLanguage &&
      formData.category &&
      formData.supportedCountries.length > 0
    );
  };

  const handleSubmit = async () => {
    if (existingShopRequest) {
      Alert.alert(
        'Shop Request Already Submitted',
        'You already have a pending shop request. Please wait for admin review.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.id && !user?._id) {
      Alert.alert('Error', 'User not authenticated');
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
      shopFormData.append('language', selectedLanguage?.code || 'en');
      shopFormData.append('category', formData.category);
      shopFormData.append('supportedCountries', JSON.stringify(formData.supportedCountries));

      if (formData.logo) {
        shopFormData.append('logo', {
          uri: formData.logo,
          type: 'image/jpeg',
          name: `shop_logo_${Date.now()}.jpg`,
        } as any);
      }

      const response = await vendorApi.createShopRequest(shopFormData);
      
      if (response.success) {
        Alert.alert(
          'Request Submitted',
          'Your shop creation request has been submitted for review.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit shop request.');
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
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Shop Request</Text>
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
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Shop Request</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {existingShopRequest && (
            <View style={[styles.infoBox, { backgroundColor: colors.warning + '20', borderLeftColor: colors.warning }]}>
              <Text style={styles.infoText}>
                You already have a pending shop request. Please wait for admin review. Each vendor can only have one shop request at a time.
              </Text>
            </View>
          )}
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Submit your shop details for admin review. Once approved, your shop will be live.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Logo <Text style={styles.required}>*</Text></Text>
            <View style={styles.logoContainer}>
              <TouchableOpacity style={styles.logoButton} onPress={selectLogo}>
                {formData.logo ? (
                  <Image source={{ uri: formData.logo }} style={styles.logoImage} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                    <Text style={styles.logoText}>Tap to add logo</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.logoText}>
                Upload a square logo (recommended: 500x500px)
              </Text>
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
            <Text style={styles.sectionTitle}>Primary Language <Text style={styles.required}>*</Text></Text>
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
              (!isFormValid() || isSubmitting || existingShopRequest) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isSubmitting || existingShopRequest}
          >
            <Text style={styles.submitButtonText}>
              {existingShopRequest ? 'Request Already Submitted' : isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateShopScreen;