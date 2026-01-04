
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useCommonStyles, spacing, typography,  borderRadius } from '../../styles/commonStyles';
import { useAuth } from '../../hooks/useAuth';
import { validateSignupForm } from '../../utils/validation';
import CountryPicker from '../../components/CountryPicker';
import LanguagePicker from '../../components/LanguagePicker';
import { Country } from '../../constants/countries';
import { Language } from '../../constants/languages';


export default function SignupScreen() {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '' as 'male' | 'female' | '',
    country: '',
    city: '',
    language: '',
    role: '' as 'user' | 'vendor' | '',
  });
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | undefined>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

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
    },
    backButton: {
      marginRight: spacing.md,
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
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
    },
    roleContainer: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    required: {
      color: colors.error,
    },
    roleOptions: {
      gap: spacing.sm,
    },
    roleOption: {
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
    },
    roleOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    roleOptionText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    roleOptionDescription: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    inputContainer: {
      marginBottom: spacing.lg,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.body,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    inputError: {
      borderColor: colors.error,
    },
    passwordContainer: {
      position: 'relative',
    },
    passwordToggle: {
      position: 'absolute',
      right: spacing.md,
      top: spacing.sm + 2,
    },
    passwordRequirements: {
      marginTop: spacing.sm,
      padding: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.sm,
    },
    passwordRequirementText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    genderContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    genderOption: {
      flex: 1,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    genderOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    genderOptionText: {
      ...typography.body,
      color: colors.text,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
    signupButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    signupButtonDisabled: {
      backgroundColor: colors.textSecondary,
    },
    signupButtonText: {
      ...typography.button,
      color: colors.white,
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.lg,
      gap: spacing.xs,
    },
    loginText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    loginLink: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRoleSelect = (role: 'user' | 'vendor') => {
    setFormData(prev => ({ ...prev, role }));
    if (errors.role) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.role;
        return newErrors;
      });
    }
  };

  const handleGenderSelect = (gender: 'male' | 'female') => {
    setFormData(prev => ({ ...prev, gender }));
    if (errors.gender) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.gender;
        return newErrors;
      });
    }
  };

  const handleSignup = async () => {
    // Validate form
    const validation = validateSignupForm(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', Object.values(validation.errors)[0]);
      return;
    }

    // Check if country is Israel (not allowed)
    if (selectedCountry?.name.toLowerCase().includes('israel')) {
      Alert.alert('Error', 'Service not available in this country');
      return;
    }

    setIsLoading(true);
    console.log('Attempting signup with data:', {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      age: parseInt(formData.age),
      gender: formData.gender,
      country: formData.country.trim(),
      city: formData.city.trim(),
      role: formData.role,
    });

    try {
      const result = await signUp({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        age: parseInt(formData.age),
        gender: formData.gender,
        country: selectedCountry?.name || formData.country.trim(),
        city: formData.city.trim(),
        language: selectedLanguage?.code || 'en',
        role: formData.role,
      });

      setIsLoading(false);

      if (result.success) {
        console.log('Signup successful, redirecting to tabs');
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => {
            setTimeout(() => {
              router.replace('/(tabs)');
            }, 100);
          }}
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleLoginPress = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Sign Up</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.subtitle}>
            Create your account to get started
          </Text>

          <View style={styles.roleContainer}>
            <Text style={styles.label}>Account Type <Text style={styles.required}>*</Text></Text>
            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  formData.role === 'user' && styles.roleOptionSelected
                ]}
                onPress={() => handleRoleSelect('user')}
              >
                <Text style={styles.roleOptionText}>Customer</Text>
                <Text style={styles.roleOptionDescription}>Browse shops, use coupons, add favorites</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  formData.role === 'vendor' && styles.roleOptionSelected
                ]}
                onPress={() => handleRoleSelect('vendor')}
              >
                <Text style={styles.roleOptionText}>Vendor</Text>
                <Text style={styles.roleOptionDescription}>Create shop, upload rolls, manage business</Text>
              </TouchableOpacity>
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="Create a password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            {!errors.password && (
              <View style={styles.passwordRequirements}>
                <Text style={styles.passwordRequirementText}>
                  • At least 8 characters{'\n'}
                  • One uppercase letter{'\n'}
                  • One lowercase letter{'\n'}
                  • One number
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                placeholder="Confirm your password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              value={formData.age}
              onChangeText={(value) => handleInputChange('age', value)}
              placeholder="Enter your age"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  formData.gender === 'male' && styles.genderOptionSelected
                ]}
                onPress={() => handleGenderSelect('male')}
              >
                <Text style={styles.genderOptionText}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  formData.gender === 'female' && styles.genderOptionSelected
                ]}
                onPress={() => handleGenderSelect('female')}
              >
                <Text style={styles.genderOptionText}>Female</Text>
              </TouchableOpacity>
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Country <Text style={styles.required}>*</Text></Text>
            <CountryPicker
              selectedCountry={selectedCountry}
              onSelect={(country) => {
                setSelectedCountry(country);
                handleInputChange('country', country.name);
              }}
              placeholder="Select your country"
            />
            {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Language <Text style={styles.required}>*</Text></Text>
            <LanguagePicker
              selectedLanguage={selectedLanguage}
              onSelect={(language) => {
                setSelectedLanguage(language);
                handleInputChange('language', language.code);
              }}
              placeholder="Select your language"
            />
            {errors.language && <Text style={styles.errorText}>{errors.language}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              placeholder="Enter your city"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          <TouchableOpacity 
            style={[
              styles.signupButton,
              isLoading && styles.signupButtonDisabled
            ]} 
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={handleLoginPress}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
