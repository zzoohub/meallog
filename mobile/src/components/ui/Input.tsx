import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import type { BaseComponentProps, AccessibilityProps } from '@/types';

type InputVariant = 'outlined' | 'filled' | 'underlined';
type InputSize = 'small' | 'medium' | 'large';

interface InputProps extends Omit<TextInputProps, 'style'>, BaseComponentProps, AccessibilityProps {
  label?: string;
  placeholder?: string;
  variant?: InputVariant;
  size?: InputSize;
  error?: boolean;
  errorText?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  required?: boolean;
  disabled?: boolean;
}

export default function Input({
  label,
  placeholder,
  variant = 'outlined',
  size = 'medium',
  error = false,
  errorText,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  required = false,
  disabled = false,
  value,
  onChangeText,
  // Accessibility props
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  // Base props
  testID,
  style,
  ...textInputProps
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const containerStyle: ViewStyle = {
    marginBottom: 16,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
    backgroundColor: variant === 'filled' ? theme.colors.surface : 'transparent',
    borderWidth: variant !== 'underlined' ? 1 : 0,
    borderBottomWidth: 1,
    borderColor: error ? theme.colors.error : isFocused ? theme.colors.primary : theme.colors.border,
    opacity: disabled ? 0.6 : 1,
  };

  const inputStyle: TextStyle = {
    flex: 1,
    fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
    color: theme.colors.text,
    paddingLeft: leftIcon ? 8 : 0,
    paddingRight: rightIcon ? 8 : 0,
  };

  const labelStyle: TextStyle = {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  };

  const helperTextStyle: TextStyle = {
    fontSize: 12,
    color: error ? theme.colors.error : theme.colors.textSecondary,
    marginTop: 4,
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
  const iconColor = theme.colors.textSecondary;

  return (
    <View style={[containerStyle, style]}>
      {label && (
        <Text style={labelStyle}>
          {label}
          {required && <Text style={{ color: theme.colors.error }}> *</Text>}
        </Text>
      )}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={iconSize}
            color={iconColor}
          />
        )}
        
        <TextInput
          style={inputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          accessible={accessible}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          testID={testID}
          {...textInputProps}
        />
        
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
            <Ionicons
              name={rightIcon}
              size={iconSize}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(errorText || helperText) && (
        <Text style={helperTextStyle}>
          {error && errorText ? errorText : helperText}
        </Text>
      )}
    </View>
  );
}

export { Input };
export type { InputProps };