import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography, borderRadius } from '../styles/commonStyles';
import { LANGUAGES, Language } from '../constants/languages';

interface LanguagePickerProps {
  selectedLanguage?: Language;
  onSelect: (language: Language) => void;
  placeholder?: string;
}

export default function LanguagePicker({ selectedLanguage, onSelect, placeholder = "Select Language" }: LanguagePickerProps) {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const styles = StyleSheet.create({
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      minHeight: 48,
    },
    selectorContent: {
      flex: 1,
    },
    selectedInfo: {
      flex: 1,
    },
    selectedText: {
      ...typography.body,
      color: colors.text,
    },
    selectedNative: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    placeholder: {
      ...typography.body,
      color: colors.textSecondary,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      ...typography.h2,
      color: colors.text,
    },
    closeButton: {
      padding: spacing.xs,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.sm,
      ...typography.body,
      color: colors.text,
    },
    list: {
      flex: 1,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      ...typography.body,
      color: colors.text,
    },
    nativeName: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    languageCode: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  });

  const filteredLanguages = LANGUAGES.filter(language =>
    language.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    language.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    language.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (language: Language) => {
    onSelect(language);
    setModalVisible(false);
    setSearchQuery('');
  };

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={styles.languageItem}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.languageInfo}>
        <Text style={styles.languageName}>{item.name}</Text>
        <Text style={styles.nativeName}>{item.nativeName}</Text>
      </View>
      <Text style={styles.languageCode}>({item.code})</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          {selectedLanguage ? (
            <>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedText}>{selectedLanguage.name}</Text>
                <Text style={styles.selectedNative}>{selectedLanguage.nativeName}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search languages..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <FlatList
            data={filteredLanguages}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </>
  );
}