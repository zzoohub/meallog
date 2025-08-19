import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { lightTheme, darkTheme, textStyles } from '@/styles/tokens';
import { SPACING } from '@/constants';
import type { BaseComponentProps } from '@/types';

interface LoadingStateProps extends BaseComponentProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  message = 'Loading...',
  size = 'large',
  color,
  fullScreen = false,
  testID,
  style,
}: LoadingStateProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const indicatorColor = color || theme.colors.primary;
  const containerStyle = fullScreen ? styles.fullScreen : styles.inline;

  return (
    <View style={[containerStyle, style]} testID={testID}>
      <ActivityIndicator
        size={size}
        color={indicatorColor}
        testID={`${testID}-indicator`}
      />
      {message && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inline: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  message: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});