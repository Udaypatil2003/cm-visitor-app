import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, FontSizes, FontWeights, BorderRadius, Spacing, Layout } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle; loader: string }> = {
  primary: {
    container: { backgroundColor: Colors.gold },
    text: { color: Colors.white },
    loader: Colors.white,
  },
  secondary: {
    container: {
      backgroundColor: Colors.white,
      borderWidth: 1.5,
      borderColor: Colors.gold,
    },
    text: { color: Colors.navy },
    loader: Colors.navy,
  },
  danger: {
    container: { backgroundColor: Colors.danger },
    text: { color: Colors.white },
    loader: Colors.white,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.navy },
    loader: Colors.navy,
  },
};

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary',
  loading = false, disabled = false,
  fullWidth = false, style,
}) => {
  const isDisabled = disabled || loading;
  const vs = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={[
        styles.base,
        vs.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={vs.loader} />
        : <Text style={[styles.label, vs.text]}>{label}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: Layout.buttonHeight,
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.full,   // fully rounded — matches design
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.55 },
  label: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.3,
  },
});