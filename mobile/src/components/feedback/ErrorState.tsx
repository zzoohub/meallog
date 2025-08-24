import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { textStyles } from '@/styles/tokens';
import { SPACING } from '@/constants';
import { Button } from '../ui/Button';
import type { BaseComponentProps } from '@/types';

interface ErrorStateProps extends BaseComponentProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  fullScreen?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  icon = 'alert-circle-outline',
  fullScreen = false,
  testID,
  style,
}: ErrorStateProps) {
  const { theme } = useTheme();

  const containerStyle = fullScreen ? styles.fullScreen : styles.inline;

  return (
    <View style={[containerStyle, style]} testID={testID}>
      <Ionicons
        name={icon}
        size={64}
        color={theme.colors.error}
        style={styles.icon}
        testID={`${testID}-icon`}
      />
      
      <Text
        style={[
          textStyles.heading3,
          { color: theme.colors.text },
          styles.title,
        ]}
        testID={`${testID}-title`}
      >
        {title}
      </Text>
      
      <Text
        style={[
          textStyles.body,
          { color: theme.colors.textSecondary },
          styles.message,
        ]}
        testID={`${testID}-message`}
      >
        {message}
      </Text>
      
      {onRetry && (
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="primary"
          style={styles.retryButton}
          testID={`${testID}-retry-button`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  inline: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  icon: {
    marginBottom: SPACING.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  retryButton: {
    minWidth: 120,
  },
});