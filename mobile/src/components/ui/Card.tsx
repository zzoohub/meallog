import React from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import type { BaseComponentProps, AccessibilityProps } from '@/types';

type CardVariant = 'flat' | 'elevated' | 'outlined';

interface CardProps extends BaseComponentProps, AccessibilityProps {
  variant?: CardVariant;
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export default function Card({
  variant = 'flat',
  onPress,
  disabled = false,
  children,
  // Accessibility props
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  // Base props
  testID,
  style,
}: CardProps) {
  const { theme } = useTheme();

  const cardStyle: ViewStyle = {
    borderRadius: 12,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: variant === 'outlined' ? theme.colors.border : 'transparent',
    elevation: variant === 'elevated' ? 4 : 0,
    shadowColor: variant === 'elevated' ? '#000' : 'transparent',
    shadowOffset: variant === 'elevated' ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: variant === 'elevated' ? 0.1 : 0,
    shadowRadius: variant === 'elevated' ? 4 : 0,
    opacity: disabled ? 0.6 : 1,
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[cardStyle, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.8 : 1}
      accessible={accessible && !!onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole || (onPress ? 'button' : undefined)}
      testID={testID}
    >
      {children}
    </Component>
  );
}

export { Card };
export type { CardProps };