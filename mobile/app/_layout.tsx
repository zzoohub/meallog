// Core React imports
import { useMemo } from 'react';

// Expo imports - grouped for better bundling
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';

// Type imports - separated for better tree shaking
import type { StackNavigationOptions } from '@react-navigation/stack';

// Internal imports - organized by dependency order
import { AppProvider } from '@/contexts';
import { useTheme } from '@/lib/theme';
import { performanceMonitor } from '@/lib/performance';
import { ANIMATION_DURATION } from '@/constants';

// Side effect imports - grouped at bottom
import 'react-native-reanimated';
import '@/lib/i18n';

interface ScreenConfig {
  name: string;
  options: StackNavigationOptions;
  lazy?: boolean;
  freezeOnBlur?: boolean;
}

export default function RootLayout() {
  const { theme, isDark } = useTheme();

  // Memoize screen configurations for better performance
  const screenConfigs = useMemo((): ScreenConfig[] => [
    {
      name: "index",
      options: {
        headerShown: false,
        gestureEnabled: false,
        animation: "fade",
        animationDuration: ANIMATION_DURATION.fast,
      },
    },
    {
      name: "auth",
      options: {
        headerShown: false,
        gestureEnabled: false,
        animation: "fade",
        animationDuration: ANIMATION_DURATION.normal,
      },
    },
    {
      name: "(main)",
      options: {
        headerShown: false,
        gestureEnabled: false,
        animationDuration: ANIMATION_DURATION.normal,
      },
    },
    {
      name: "meal-detail",
      options: {
        headerShown: false,
        presentation: "modal",
        animation: "slide_from_bottom",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
      freezeOnBlur: true,
    },
    {
      name: "meal-history",
      options: {
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
    },
    {
      name: "ai-coach",
      options: {
        headerShown: false,
        presentation: "modal",
        animation: "slide_from_left",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
      freezeOnBlur: true,
    },
    {
      name: "profile",
      options: {
        headerShown: false,
        presentation: "modal",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
      freezeOnBlur: true,
    },
    {
      name: "challenge-detail",
      options: {
        headerShown: false,
        presentation: "modal",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
      freezeOnBlur: true,
    },
    {
      name: "settings",
      options: {
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
    },
    {
      name: "settings/account",
      options: {
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
    },
    {
      name: "settings/display",
      options: {
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
    },
    {
      name: "settings/notifications",
      options: {
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
    },
    {
      name: "settings/privacy",
      options: {
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
    },
    {
      name: "settings/goals",
      options: {
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
    },
    {
      name: "settings/data",
      options: {
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        animationDuration: ANIMATION_DURATION.normal,
      },
      lazy: true,
    },
  ], []);

  // Global stack options with theme integration
  const stackScreenOptions = useMemo((): StackNavigationOptions => ({
    headerShown: false,
    animation: "slide_from_right",
    gestureEnabled: true,
    animationDuration: ANIMATION_DURATION.normal,
    // Theme-aware card style
    cardStyle: {
      backgroundColor: theme.colors.background,
    },
    // Performance optimizations
    cardOverlayEnabled: true,
    cardShadowEnabled: true,
    // Accessibility
    screenReaderEnabled: true,
  }), [theme.colors.background]);

  return (
    <AppProvider>
      <Stack
        screenOptions={stackScreenOptions}
        screenListeners={{
          // Performance monitoring for all screens
          beforeRemove: (e) => {
            const screenName = e.target?.split('-')[0] || 'unknown';
            performanceMonitor.endNavigation('unknown', screenName);
          },
          focus: (e) => {
            const screenName = e.target?.split('-')[0] || 'unknown';
            performanceMonitor.startNavigation('unknown', screenName);
          },
        }}
      >
        {screenConfigs.map(({ name, options, lazy, freezeOnBlur }) => (
          <Stack.Screen
            key={name}
            name={name}
            options={{
              ...options,
              // Additional performance options
              lazy,
              freezeOnBlur,
            }}
          />
        ))}
      </Stack>
      <StatusBar 
        style={isDark ? "light" : "dark"} 
        backgroundColor={theme.colors.background}
        translucent={false}
      />
    </AppProvider>
  );
}
