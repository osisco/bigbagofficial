import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useColors } from '../styles/commonStyles';

interface ButtonProps {
  text: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

export default function Button({ text, onPress, style, textStyle }: ButtonProps) {
  const colors = useColors();
  const commonStyles = useCommonStyles();
  
  const styles = StyleSheet.create({
    button: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      marginTop: 10,
      width: '100%',
      boxShadow: `0px 2px 3.84px ${colors.shadow}`,
      elevation: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.buttonText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
}
