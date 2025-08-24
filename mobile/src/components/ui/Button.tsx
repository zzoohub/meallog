import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import type { BaseComponentProps, AccessibilityProps } from '@/types';

type ButtonVariant = 'filled' | 'outlined' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends BaseComponentProps, AccessibilityProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'filled',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  testID,
  style,
}: ButtonProps) {
  const { theme } = useTheme();

  const buttonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: size === 'small' ? 12 : size === 'large' ? 24 : 16,
    paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
    backgroundColor: variant === 'filled' ? theme.colors.primary : 'transparent',
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: variant === 'outlined' ? theme.colors.primary : 'transparent',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
  };

  const textStyle: TextStyle = {
    fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
    fontWeight: '600',
    color: variant === 'filled' ? '#FFFFFF' : theme.colors.primary,
    marginLeft: icon ? 8 : 0,
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
        ...accessibilityState,
      }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'filled' ? '#FFFFFF' : theme.colors.primary}
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={variant === 'filled' ? '#FFFFFF' : theme.colors.primary}
            />
          )}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export { Button };
export type { ButtonProps };