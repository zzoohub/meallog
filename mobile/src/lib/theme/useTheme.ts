import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { ColorSchemeName } from 'react-native';

// Simple theme configuration
const lightColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#6D6D80',
  border: '#C7C7CC',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
};

const darkColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
};

export interface Theme {
  colors: typeof lightColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
};

const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
};

interface UseThemeReturn {
  theme: Theme;
  colors: Theme['colors'];
  colorScheme: NonNullable<ColorSchemeName>;
  isDark: boolean;
  isLight: boolean;
}

export function useTheme(): UseThemeReturn {
  const systemColorScheme = useColorScheme();
  const effectiveColorScheme = systemColorScheme || 'light';
  
  const theme = useMemo((): Theme => ({
    colors: effectiveColorScheme === 'dark' ? darkColors : lightColors,
    spacing,
    borderRadius,
    fontSize,
  }), [effectiveColorScheme]);
  
  return {
    theme,
    colors: theme.colors,
    colorScheme: effectiveColorScheme,
    isDark: effectiveColorScheme === 'dark',
    isLight: effectiveColorScheme === 'light',
  };
}

export { lightColors, darkColors };
export type { Theme as ThemeType };