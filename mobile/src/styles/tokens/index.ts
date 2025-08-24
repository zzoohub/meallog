import { 
  SPACING, 
  BORDER_RADIUS, 
  FONT_SIZES, 
  FONT_WEIGHTS, 
  LIGHT_THEME_COLORS, 
  DARK_THEME_COLORS 
} from '../../constants';

// Design tokens for consistent styling across the app
export const tokens = {
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  fontSize: FONT_SIZES,
  fontWeight: FONT_WEIGHTS,
  
  // Elevation/shadow levels
  elevation: {
    none: 0,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  
  // Opacity levels
  opacity: {
    disabled: 0.4,
    hover: 0.8,
    pressed: 0.6,
    overlay: 0.5,
    backdrop: 0.75,
  },
  
  // Animation curves
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// Theme definitions
export const lightTheme = {
  colors: LIGHT_THEME_COLORS,
  isDark: false,
  statusBar: 'dark-content' as const,
} as const;

export const darkTheme = {
  colors: DARK_THEME_COLORS,
  isDark: true,
  statusBar: 'light-content' as const,
} as const;

export type Theme = typeof lightTheme;

// Utility functions for creating consistent styles
export const createSpacing = (multiplier: number): number => SPACING.md * multiplier;

export const createElevation = (level: keyof typeof tokens.elevation) => {
  const elevation = tokens.elevation[level];
  return {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: elevation / 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: elevation,
    elevation,
  };
};

// Text style presets
export const textStyles = {
  heading1: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxxl * 1.2,
  },
  heading2: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.xxl * 1.2,
  },
  heading3: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.xl * 1.3,
  },
  body: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.md * 1.5,
  },
  bodyBold: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.md * 1.5,
  },
  caption: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  button: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.md * 1.2,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.xs * 1.3,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
} as const;

// Component style presets
export const componentStyles = {
  button: {
    primary: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      minHeight: 48,
    },
    secondary: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      minHeight: 48,
    },
    small: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      minHeight: 36,
    },
  },
  input: {
    default: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      minHeight: 48,
      fontSize: FONT_SIZES.md,
    },
  },
  card: {
    default: {
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: 'transparent', // Will be overridden by theme
      ...createElevation('sm'),
    },
    elevated: {
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: 'transparent', // Will be overridden by theme
      ...createElevation('md'),
    },
  },
} as const;