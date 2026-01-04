
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useColors, useCommonStyles, spacing, typography,  borderRadius } from '../../styles/commonStyles';
import { Category } from '../../types';
import { categoriesApi, handleApiError } from '../../services/api';


const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38BA8',
  '#A8DADC', '#FFB3BA', '#BFDBFE', '#C7F9CC', '#FDE68A',
  '#DDD6FE', '#FECACA', '#FED7AA', '#D1FAE5', '#E0E7FF'
];

const AVAILABLE_ICONS = [
  'shirt-outline', 'phone-portrait-outline', 'flower-outline', 'home-outline',
  'fitness-outline', 'book-outline', 'happy-outline', 'airplane-outline',
  'basket-outline', 'paw-outline', 'gift-outline', 'bed-outline',
  'car-outline', 'restaurant-outline', 'musical-notes-outline', 'camera-outline'
];

export default function ManageCategoriesScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const { user, isAdmin, isLoading } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'grid-outline',
    color: '#FF6B6B'
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
    categoryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      ...typography.bodyBold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    categoryId: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    editButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    deleteButton: {
      backgroundColor: colors.error,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
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
    colorPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    colorOption: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedColor: {
      borderColor: colors.text,
    },
    iconPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    iconOption: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedIcon: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
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
    console.log('Loading categories data...');
    try {
      const response = await categoriesApi.getAll();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  }, []);

  useEffect(() => {
    console.log('ManageCategoriesScreen: Checking admin access');
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

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      icon: 'grid-outline',
      color: '#FF6B6B'
    });
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color
    });
    setShowModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await categoriesApi.delete(category.id);
              if (response.success) {
                Alert.alert('Success', 'Category deleted successfully');
                loadData();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete category');
              }
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', handleApiError(error));
            }
          }
        }
      ]
    );
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const response = await categoriesApi.update(editingCategory.id, {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color
        });
        if (response.success) {
          Alert.alert('Success', 'Category updated successfully');
          setShowModal(false);
          loadData();
        } else {
          Alert.alert('Error', response.message || 'Failed to update category');
        }
      } else {
        // Add new category
        const response = await categoriesApi.create({
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color
        });
        if (response.success) {
          Alert.alert('Success', 'Category added successfully');
          setShowModal(false);
          loadData();
        } else {
          Alert.alert('Error', response.message || 'Failed to add category');
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', handleApiError(error));
    }
  };

  const renderCategory = (category: Category) => (
    <View key={category.id} style={styles.categoryCard}>
      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
        <Ionicons name={category.icon as any} size={24} color={colors.white} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.categoryId}>ID: {category.id}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => handleEditCategory(category)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => handleDeleteCategory(category)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderColorPicker = () => (
    <View style={styles.colorPicker}>
      {AVAILABLE_COLORS.map((color, index) => (
        <TouchableOpacity
          key={`color-${index}-${color}`}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            formData.color === color && styles.selectedColor
          ]}
          onPress={() => setFormData({ ...formData, color })}
        />
      ))}
    </View>
  );

  const renderIconPicker = () => (
    <View style={styles.iconPicker}>
      {AVAILABLE_ICONS.map((icon, index) => (
        <TouchableOpacity
          key={`icon-${index}-${icon}`}
          style={[
            styles.iconOption,
            formData.icon === icon && styles.selectedIcon
          ]}
          onPress={() => setFormData({ ...formData, icon })}
        >
          <Ionicons name={icon as any} size={24} color={colors.text} />
        </TouchableOpacity>
      ))}
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
        <Text style={styles.headerTitle}>Manage Categories</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Categories ({categories.length})</Text>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {categories.length > 0 ? (
            categories.map(renderCategory)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons 
                name="grid-outline" 
                size={64} 
                color={colors.textSecondary} 
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Categories</Text>
              <Text style={styles.emptyDescription}>
                No categories found. Add your first category to get started.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Category Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter category name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Color</Text>
              {renderColorPicker()}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Icon</Text>
              {renderIconPicker()}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveCategory}
              >
                <Text style={styles.buttonText}>
                  {editingCategory ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
