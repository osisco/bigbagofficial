
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { useColors, useCommonStyles, spacing, typography,  borderRadius } from '../../styles/commonStyles';
import { Ad, Shop } from '../../types';
import { adsApi, shopsApi, handleApiError } from '../../services/api';


export default function ManageAdsScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { user, isAdmin, isLoading } = useAuth();
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    linkType: 'internal' as 'internal' | 'external',
    linkUrl: '',
    shopId: '',
    priority: 1
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
    },
    headerTitle: {
      ...typography.h2,
      color: colors.text,
      flex: 1,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    addButtonText: {
      ...typography.button,
      color: colors.white,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    adCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    adImage: {
      width: '100%',
      height: 120,
      backgroundColor: colors.card,
    },
    adHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    adTitle: {
      ...typography.bodyBold,
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    activeBadge: {
      backgroundColor: colors.success + '20',
    },
    inactiveBadge: {
      backgroundColor: colors.error + '20',
    },
    statusText: {
      ...typography.caption,
      fontWeight: '600',
    },
    activeText: {
      color: colors.success,
    },
    inactiveText: {
      color: colors.error,
    },
    adDetails: {
      padding: spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    detailLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    detailValue: {
      ...typography.caption,
      color: colors.text,
      fontWeight: '600',
    },
    actionButtons: {
      flexDirection: 'row',
      padding: spacing.md,
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    editButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
    },
    toggleButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
    },
    activateButton: {
      backgroundColor: colors.success,
    },
    deactivateButton: {
      backgroundColor: colors.warning,
    },
    deleteButton: {
      flex: 1,
      backgroundColor: colors.error,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
    },
    buttonText: {
      ...typography.caption,
      color: colors.white,
      fontWeight: '600',
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
      color: colors.text,
      marginBottom: spacing.sm,
    },
    emptyDescription: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modalTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    inputGroup: {
      marginBottom: spacing.lg,
    },
    inputLabel: {
      ...typography.bodyBold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    textInput: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      ...typography.body,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    imagePickerButton: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    imagePickerText: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    selectedImage: {
      width: '100%',
      height: 120,
      borderRadius: borderRadius.md,
      backgroundColor: colors.card,
    },
    shopSelector: {
      maxHeight: 150,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
    },
    shopOption: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedShop: {
      backgroundColor: colors.primary + '20',
    },
    shopOptionText: {
      ...typography.body,
      color: colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.border,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    saveButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
  });

  const loadData = useCallback(async () => {
    console.log('Loading ads data...');
    try {
      const [adsResponse, shopsResponse] = await Promise.all([
        adsApi.getAll(),
        shopsApi.getAll()
      ]);
      
      if (adsResponse.success) {
        setAds(adsResponse.data || []);
      }
      
      if (shopsResponse.success) {
        setShops(shopsResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  }, []);

  useEffect(() => {
    console.log('ManageAdsScreen: Checking admin access');
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

  const handleBack = () => {
    router.back();
  };

  const handleAddAd = () => {
    setEditingAd(null);
    setFormData({
      title: '',
      image: '',
      linkType: 'internal',
      linkUrl: '',
      shopId: '',
      priority: 1
    });
    setShowModal(true);
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      image: ad.image,
      linkType: ad.linkType,
      linkUrl: ad.linkUrl,
      shopId: ad.shopId || '',
      priority: ad.priority
    });
    setShowModal(true);
  };

  const handleToggleAd = async (ad: Ad) => {
    try {
      const response = await adsApi.update(ad.id, { isActive: !ad.isActive });
      if (response.success) {
        Alert.alert('Success', `Ad ${ad.isActive ? 'deactivated' : 'activated'} successfully`);
        loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to update ad status');
      }
    } catch (error) {
      console.error('Error toggling ad:', error);
      Alert.alert('Error', handleApiError(error));
    }
  };

  const handleDeleteAd = (ad: Ad) => {
    Alert.alert(
      'Delete Ad',
      `Are you sure you want to delete "${ad.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await adsApi.delete(ad.id);
              if (response.success) {
                Alert.alert('Success', 'Ad deleted successfully');
                loadData();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete ad');
              }
            } catch (error) {
              console.error('Error deleting ad:', error);
              Alert.alert('Error', handleApiError(error));
            }
          }
        }
      ]
    );
  };

  const handleSelectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, image: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSelectShop = (shopId: string) => {
    setFormData({ 
      ...formData, 
      shopId,
      linkType: 'internal',
      linkUrl: `/shop/${shopId}`
    });
  };

  const handleSaveAd = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an ad title');
      return;
    }

    if (!formData.image) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    if (formData.linkType === 'external' && !formData.linkUrl.trim()) {
      Alert.alert('Error', 'Please enter a link URL');
      return;
    }

    if (formData.linkType === 'internal' && !formData.shopId) {
      Alert.alert('Error', 'Please select a shop');
      return;
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add the image file
      formDataToSend.append('image', {
        uri: formData.image,
        type: 'image/jpeg',
        name: 'ad-image.jpg',
      } as any);
      
      // Add other fields
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('linkType', formData.linkType);
      formDataToSend.append('linkUrl', formData.linkType === 'internal' ? `/shop/${formData.shopId}` : formData.linkUrl.trim());
      if (formData.linkType === 'internal' && formData.shopId) {
        formDataToSend.append('shopId', formData.shopId);
      }
      formDataToSend.append('priority', formData.priority.toString());
      formDataToSend.append('isActive', 'true');
      formDataToSend.append('createdBy', user?.id || '');
      formDataToSend.append('createdAt', new Date().toISOString().split('T')[0]);

      if (editingAd) {
        const response = await adsApi.update(editingAd.id, formDataToSend);
        if (response.success) {
          Alert.alert('Success', 'Ad updated successfully');
          setShowModal(false);
          loadData();
        } else {
          Alert.alert('Error', response.message || 'Failed to update ad');
        }
      } else {
        const response = await adsApi.create(formDataToSend);
        if (response.success) {
          Alert.alert('Success', 'Ad added successfully');
          setShowModal(false);
          loadData();
        } else {
          Alert.alert('Error', response.message || 'Failed to add ad');
        }
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      Alert.alert('Error', handleApiError(error));
    }
  };

  const getShopName = (shopId?: string) => {
    if (!shopId) return 'N/A';
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.name : 'Unknown Shop';
  };

  const renderAd = (ad: Ad) => (
    <View key={ad.id} style={styles.adCard}>
      <Image source={{ uri: ad.image }} style={styles.adImage} />
      
      <View style={styles.adHeader}>
        <Text style={styles.adTitle}>{ad.title}</Text>
        <View style={[styles.statusBadge, ad.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, ad.isActive ? styles.activeText : styles.inactiveText]}>
            {ad.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.adDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{ad.linkType}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Shop:</Text>
          <Text style={styles.detailValue}>{getShopName(ad.shopId)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Priority:</Text>
          <Text style={styles.detailValue}>{ad.priority}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>{ad.createdAt}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => handleEditAd(ad)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, ad.isActive ? styles.deactivateButton : styles.activateButton]} 
          onPress={() => handleToggleAd(ad)}
        >
          <Text style={styles.buttonText}>
            {ad.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => handleDeleteAd(ad)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.headerTitle}>Manage Ads</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAd}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Advertisements ({ads.length})</Text>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {ads.length > 0 ? (
            ads.map(renderAd)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons 
                name="megaphone-outline" 
                size={64} 
                color={colors.textSecondary} 
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Advertisements</Text>
              <Text style={styles.emptyDescription}>
                No ads found. Create your first advertisement to get started.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Ad Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingAd ? 'Edit Advertisement' : 'Add Advertisement'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter ad title"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Image</Text>
                {formData.image ? (
                  <TouchableOpacity onPress={handleSelectImage}>
                    <Image source={{ uri: formData.image }} style={styles.selectedImage} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.imagePickerButton} onPress={handleSelectImage}>
                    <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                    <Text style={styles.imagePickerText}>Tap to select image</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Link Type</Text>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <TouchableOpacity
                    key="link-type-internal"
                    style={[
                      styles.toggleButton,
                      formData.linkType === 'internal' ? styles.activateButton : styles.deactivateButton
                    ]}
                    onPress={() => setFormData({ ...formData, linkType: 'internal' })}
                  >
                    <Text style={styles.buttonText}>Internal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    key="link-type-external"
                    style={[
                      styles.toggleButton,
                      formData.linkType === 'external' ? styles.activateButton : styles.deactivateButton
                    ]}
                    onPress={() => setFormData({ ...formData, linkType: 'external' })}
                  >
                    <Text style={styles.buttonText}>External</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {formData.linkType === 'internal' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Shop</Text>
                  <ScrollView style={styles.shopSelector}>
                    {shops.map((shop) => (
                      <TouchableOpacity
                        key={shop.id}
                        style={[
                          styles.shopOption,
                          formData.shopId === shop.id && styles.selectedShop
                        ]}
                        onPress={() => handleSelectShop(shop.id)}
                      >
                        <Text style={styles.shopOptionText}>{shop.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>External URL</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.linkUrl}
                    onChangeText={(text) => setFormData({ ...formData, linkUrl: text })}
                    placeholder="https://example.com"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priority (1-10)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.priority.toString()}
                  onChangeText={(text) => setFormData({ ...formData, priority: parseInt(text) || 1 })}
                  placeholder="1"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  key="cancel-button"
                  style={styles.cancelButton} 
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  key="save-button"
                  style={styles.saveButton} 
                  onPress={handleSaveAd}
                >
                  <Text style={styles.buttonText}>
                    {editingAd ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
