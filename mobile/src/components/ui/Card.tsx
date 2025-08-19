import React from 'react';
import {
  View,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { componentStyles } from '@/styles/tokens';
import type { BaseComponentProps } from '@/types';

interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'elevated' | 'subtle' | 'grouped';
  onPress?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({
  children,
  variant = 'default',
  onPress,
  padding = 'medium',
  testID,
  style,
}: CardProps) {
  const { theme, colorScheme } = useTheme();

  const getCardStyle = (): ViewStyle => {
    const paddingValue = {
      none: 0,
      small: 8,
      medium: 16,
      large: 24,
    }[padding];

    switch (variant) {
      case 'elevated':
        return {
          ...componentStyles.card.elevated,
          backgroundColor: theme.colors.surface,
          padding: paddingValue,
          borderWidth: 0,
        };
      
      case 'subtle':
        return {
          ...componentStyles.card.default,
          backgroundColor: colorScheme === 'dark' 
            ? 'rgba(255, 255, 255, 0.03)' 
            : 'rgba(0, 0, 0, 0.02)',
          padding: paddingValue,
          borderWidth: 0,
          shadowOpacity: 0, // Remove shadow for subtle variant
          elevation: 0,
        };
      
      case 'grouped':
        return {
          ...componentStyles.card.default,
          backgroundColor: theme.colors.surface,
          padding: paddingValue,
          borderWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        };
      
      case 'default':
      default:
        return {
          ...componentStyles.card.default,
          backgroundColor: theme.colors.surface,
          padding: paddingValue,
          borderColor: theme.colors.border + '20', // 20% opacity for subtle border
          borderWidth: 0.5, // Thinner border
        };
    }
  };

  const cardStyle = getCardStyle();

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {children}
    </View>
  );
}

// No styles required