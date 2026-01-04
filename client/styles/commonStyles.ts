
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const lightColors = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
  background: '#FFFFFF',
  backgroundAlt: '#F8F9FA',
  surface: '#F8F9FA',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  border: '#E9ECEF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#95A5A6',
};

const darkColors = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
  background: '#0A0A0A',
  backgroundAlt: '#1A1A1A',
  surface: '#1F1F1F',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  border: '#404040',
  shadow: 'rgba(0, 0, 0, 0.5)',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#606060',
};

export const useColors = () => {
  const { isDark } = useTheme();
  return isDark ? darkColors : lightColors;
};

export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  h1: {
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 2px 8px ${colors.shadow}`,
    elevation: 3,
  },
  secondary: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});

export const useCommonStyles = () => {
  const colors = useColors();
  
  return StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background,
      width: '100%',
      height: '100%',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    centerContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spaceBetween: {
      justifyContent: 'space-between',
    },
    title: {
      ...typography.h1,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    subtitle: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    text: {
      ...typography.body,
      color: colors.text,
    },
    textSecondary: {
      ...typography.body,
      color: colors.textSecondary,
    },
    caption: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginVertical: spacing.sm,
      boxShadow: `0px 2px 8px ${colors.shadow}`,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    section: {
      marginVertical: spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },
    shadow: {
      boxShadow: `0px 2px 8px ${colors.shadow}`,
      elevation: 3,
    },
    bottomTabBar: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
    },
    tabBarIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
    },
  });
};

// Default export for backward compatibility
export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: lightColors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  title: {
    ...typography.h1,
    color: lightColors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.h2,
    color: lightColors.text,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.body,
    color: lightColors.text,
  },
  textSecondary: {
    ...typography.body,
    color: lightColors.textSecondary,
  },
  caption: {
    ...typography.caption,
    color: lightColors.textSecondary,
  },
  card: {
    backgroundColor: lightColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    boxShadow: `0px 2px 8px ${lightColors.shadow}`,
    elevation: 2,
    borderWidth: 1,
    borderColor: lightColors.border,
  },
  section: {
    marginVertical: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: lightColors.border,
    marginVertical: spacing.md,
  },
  shadow: {
    boxShadow: `0px 2px 8px ${lightColors.shadow}`,
    elevation: 3,
  },
  bottomTabBar: {
    backgroundColor: lightColors.surface,
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
    paddingTop: spacing.md,
  },
  tabBarIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
});
