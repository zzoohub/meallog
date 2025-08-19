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
import { componentStyles, textStyles } from '@/styles/tokens';
import { triggerHaptic } from '@/utils';
import type { BaseComponentProps } from '@/types';

interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  haptic = true,
  fullWidth = false,
  testID,
  style,
}: ButtonProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    
    if (haptic) {
      triggerHaptic('LIGHT');
    }
    
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = size === 'small' 
      ? componentStyles.button.small 
      : componentStyles.button.primary;

    const styles: ViewStyle = {
      ...baseStyle,
      opacity: disabled ? 0.4 : 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...(fullWidth && { width: '100%' }),
    };

    switch (variant) {
      case 'primary':
        return {
          ...styles,
          backgroundColor: theme.colors.primary,
        };
      case 'secondary':
        return {
          ...styles,
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
          borderWidth: 1,
        };
      case 'ghost':
        return {
          ...styles,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...styles,
          backgroundColor: theme.colors.error,
        };
      default:
        return styles;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = textStyles.button;

    switch (variant) {
      case 'primary':
      case 'danger':
        return {
          ...baseStyle,
          color: 'white',
        };
      case 'secondary':
      case 'ghost':
        return {
          ...baseStyle,
          color: theme.colors.primary,
        };
      default:
        return {
          ...baseStyle,
          color: theme.colors.text,
        };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? 'white' : theme.colors.primary}
        />
      );
    }

    const iconElement = icon && (
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={getTextStyle().color}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );

    const textElement = (
      <Text style={getTextStyle()} numberOfLines={1}>
        {title}
      </Text>
    );

    return (
      <>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});