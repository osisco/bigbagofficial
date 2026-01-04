import BottomSheet, { BottomSheetView, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCountry } from '../../hooks/useCountry';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ShareEarnComponent from '../../components/ShareEarnComponent';

export default function AccountScreen() {
  const countryBottomSheetRef = useRef<BottomSheet>(null);
  const languageBottomSheetRef = useRef<BottomSheet>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');
  const { selectedLanguage, changeLanguage, availableLanguages } = useLanguage();
  const { selectedCountry, changeCountry, availableCountries } = useCountry();
  const { user, vendorProfile, isAuthenticated, signOut, isAdmin, isVendor, isUser, refreshUserProfile, refreshVendorProfile } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = useColors();
  const commonStyles = useCommonStyles();

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshUserProfile();
      if (isVendor()) {
        refreshVendorProfile();
      }
    }
  }, [isAuthenticated]); 

  const styles = StyleSheet.create({   
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
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
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 100,
    },
    userInfo: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
    },
    userName: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    userEmail: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    userRole: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    userReels: {
      ...typography.caption,
      color: colors.success,
      fontWeight: '600',
      marginTop: spacing.xs,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    menuItemIcon: {
      marginRight: spacing.md,
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    menuItemSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    menuItemArrow: {
      marginLeft: spacing.sm,
    },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    authButtons: {
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    authButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    authButtonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    authButtonText: {
      ...typography.button,
      color: colors.white,
    },
    authButtonTextSecondary: {
      color: colors.text,
    },
    signOutButton: {
      backgroundColor: colors.error,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    signOutButtonText: {
      ...typography.button,
      color: colors.white,
    },
    bottomSheetContent: {
      flex: 1,
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    bottomSheetTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      marginBottom: spacing.lg,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.sm,
      ...typography.body,
      color: colors.text,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    optionItemSelected: {
      backgroundColor: colors.primary + '20',
    },
    optionItemText: {
      ...typography.body,
      color: colors.text,
      marginLeft: spacing.md,
    },
    optionItemSelectedText: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  const filteredCountries = availableCountries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLanguages = availableLanguages.filter(language =>
    language.name.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
    language.nativeName.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
    language.code.toLowerCase().includes(languageSearchQuery.toLowerCase())
  );

  const handleCountryPress = () => {
    countryBottomSheetRef.current?.expand();
  };

  const handleLanguagePress = () => {
    languageBottomSheetRef.current?.expand();
  };

  const handleCountrySelect = (countryCode: string) => {
    changeCountry(countryCode);
    countryBottomSheetRef.current?.close();
    setSearchQuery('');
  };

  const handleLanguageSelect = (languageCode: string) => {
    changeLanguage(languageCode);
    languageBottomSheetRef.current?.close();
    setLanguageSearchQuery('');
  };

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Force navigation to login screen after sign out
              router.replace('/auth/login');
              Alert.alert('Success', 'Signed out successfully');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleCreateShop = () => {
    if (!vendorProfile?.shopId) {
      router.push('/vendor/create-shop');
    } else {
      Alert.alert('Info', 'You already have a shop. Each vendor can only create one shop.');
    }
  };

  const handleReelPackages = () => {
    router.push('/vendor/roll-packages');
  };

  const handleAdminCreateShop = () => {
    router.push('/admin/create-shop');
  };

  const handleManageShops = () => {
    router.push('/admin/manage-shops');
  };

  const handleManageCategories = () => {
    router.push('/admin/manage-categories');
  };

  const handleManageAds = () => {
    router.push('/admin/manage-ads');
  };

  const handleAdminCreateCoupon = () => {
    router.push('/vendor/create-coupon');
  };

  const handleAdminCreateOffer = () => {
    router.push('/vendor/create-offer');
  };

  const handleSavedReels = () => {
    router.push('/saved-rolls');
  };

  const handleCreateCoupon = () => {
    router.push('/vendor/create-coupon');
  };

  const handleCreateOffer = () => {
    router.push('/vendor/create-offer');
  };

  const handleReelsEarned = (reelsEarned: number) => {
    refreshUserProfile();
    if (isVendor()) {
      refreshVendorProfile(); // Also refresh vendor profile for vendors
    }
    console.log(`User earned ${reelsEarned} rolls!`);
  };

  const renderMenuItem = (item: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
      <Ionicons
        name={item.icon as any}
        size={24}
        color={item.color || colors.text}
        style={styles.menuItemIcon}
      />
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textSecondary}
        style={styles.menuItemArrow}
      />
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>Manage your profile and preferences</Text>
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isAuthenticated && user && (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
              {user.reels !== undefined && (
                <Text style={styles.userReels}>Reels: {user.reels}</Text>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.themeToggle}>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Dark Mode</Text>
                <Text style={styles.menuItemSubtitle}>Toggle dark/light theme</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {isAuthenticated && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Activity</Text>
                
                {renderMenuItem({
                  icon: 'heart-outline',
                  title: 'Saved Reels',
                  subtitle: 'View your saved content',
                  onPress: handleSavedReels,
                })}
              </View>

              {isVendor() && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vendor Tools</Text>
                  
                  {vendorProfile?.shopId ? (
                    renderMenuItem({
                      icon: 'storefront',
                      title: 'My Shop',
                      subtitle: 'View and manage your shop',
                      onPress: () => router.push(`/shop/${vendorProfile.shopId}`),
                      color: colors.primary,
                    })
                  ) : (
                    renderMenuItem({
                      icon: 'storefront-outline',
                      title: 'Create Shop',
                      subtitle: 'Start your business',
                      onPress: handleCreateShop,
                    })
                  )}
                  
                  {renderMenuItem({
                    icon: 'pricetag-outline',
                    title: 'Create Coupon',
                    subtitle: 'Add new discount offers',
                    onPress: handleCreateCoupon,
                  })}
                  
                  {renderMenuItem({
                    icon: 'gift-outline',
                    title: 'Create Offer',
                    subtitle: 'Add special promotions',
                    onPress: handleCreateOffer,
                  })}
                  
                  {renderMenuItem({
                    icon: 'diamond-outline',
                    title: 'Reel Packages',
                    subtitle: 'Purchase promotion reels',
                    onPress: handleReelPackages,
                  })}
                </View>
              )}

              {isAdmin() && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Admin Panel</Text>
                  
                  {renderMenuItem({
                    icon: 'storefront-outline',
                    title: 'Create Shop',
                    subtitle: 'Create shops for big companies',
                    onPress: handleAdminCreateShop,
                  })}
                  
                  {renderMenuItem({
                    icon: 'business-outline',
                    title: 'Manage Shops',
                    subtitle: 'View and manage all shops',
                    onPress: handleManageShops,
                  })}
                  
                  {renderMenuItem({
                    icon: 'grid-outline',
                    title: 'Manage Categories',
                    subtitle: 'Add and edit categories',
                    onPress: handleManageCategories,
                  })}
                  
                  {renderMenuItem({
                    icon: 'megaphone-outline',
                    title: 'Manage Ads',
                    subtitle: 'Control advertisement content',
                    onPress: handleManageAds,
                  })}
                  
                  {renderMenuItem({
                    icon: 'pricetag-outline',
                    title: 'Create Coupon',
                    subtitle: 'Add coupons for any shop',
                    onPress: handleAdminCreateCoupon,
                  })}
                  
                  {renderMenuItem({
                    icon: 'gift-outline',
                    title: 'Create Offer',
                    subtitle: 'Add offers for any shop',
                    onPress: handleAdminCreateOffer,
                  })}
                </View>
              )}

              {!isAdmin() && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Earn Reels</Text>
                  <ShareEarnComponent onReelsEarned={handleReelsEarned} />
                </View>
              )}

              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}

          {!isAuthenticated && (
            <View style={styles.authButtons}>
              <TouchableOpacity style={styles.authButton} onPress={handleSignIn}>
                <Text style={styles.authButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authButton, styles.authButtonSecondary]}
                onPress={handleSignUp}
              >
                <Text style={[styles.authButtonText, styles.authButtonTextSecondary]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}