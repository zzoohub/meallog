import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { Card } from '@/components/ui/Card';
import * as Haptics from 'expo-haptics';

interface SettingsItemProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'select' | 'navigation' | 'info';
  value?: any;
  onPress?: () => void;
  onValueChange?: (value: any) => void;
  disabled?: boolean;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'grouped';
}

export function SettingsItem({
  title,
  description,
  icon,
  type,
  value,
  onPress,
  onValueChange,
  disabled = false,
  showChevron = true,
  rightElement,
  variant = 'default',
}: SettingsItemProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    if (disabled) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptics feedback failed:', error);
    }
    
    if (type === 'toggle' && onValueChange) {
      onValueChange(!value);
    } else if (onPress) {
      onPress();
    }
  };

  const renderRightElement = () => {
    if (rightElement) {
      return rightElement;
    }

    switch (type) {
      case 'toggle':
        return (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary + '40',
            }}
            thumbColor={value ? theme.colors.primary : '#f4f3f4'}
            ios_backgroundColor={theme.colors.border}
            disabled={disabled}
          />
        );
      case 'select':
        return (
          <View style={styles.selectValue}>
            <Text style={[styles.valueText, { color: theme.colors.textSecondary }]}>
              {value}
            </Text>
            {showChevron && (
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.textSecondary}
                style={styles.chevron}
              />
            )}
          </View>
        );
      case 'navigation':
        return showChevron ? (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        ) : null;
      case 'info':
        return (
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {value}
          </Text>
        );
      default:
        return null;
    }
  };

  const isInteractive = type !== 'info' && !disabled;

  const content = (
    <View style={[
      styles.container,
      { opacity: disabled ? 0.6 : 1 }
    ]}>
      <View style={styles.leftSection}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons
              name={icon}
              size={20}
              color={theme.colors.primary}
            />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          {description && (
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.rightSection}>
        {renderRightElement()}
      </View>
    </View>
  );

  if (variant === 'grouped') {
    // For grouped items, no card wrapper - just the content
    if (isInteractive) {
      return (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={disabled}
          style={styles.groupedContainer}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.groupedContainer}>
        {content}
      </View>
    );
  }

  // Default variant with refined styling
  if (isInteractive) {
    return (
      <Card variant="subtle" style={styles.card}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={disabled}
        >
          {content}
        </TouchableOpacity>
      </Card>
    );
  }

  return (
    <Card variant="subtle" style={styles.card}>
      {content}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    padding: 0,
    overflow: 'hidden',
  },
  groupedContainer: {
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 56,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  rightSection: {
    marginLeft: 12,
  },
  selectValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 15,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 4,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '500',
  },
});