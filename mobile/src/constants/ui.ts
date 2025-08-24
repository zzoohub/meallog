/**
 * UI Constants
 * All user interface related constants including dimensions, animations, and visual properties
 */

// Platform-specific dimensions
export const DIMENSIONS = {
  // Safe area and navigation
  TAB_BAR_HEIGHT: 70,
  TAB_BAR_HEIGHT_IOS: 85,
  HEADER_HEIGHT: 56,
  HEADER_HEIGHT_IOS: 64,
  STATUS_BAR_HEIGHT: 24,
  STATUS_BAR_HEIGHT_IOS: 20,
  
  // Touch targets (following accessibility guidelines)
  MIN_TOUCH_TARGET: 44,
  RECOMMENDED_TOUCH_TARGET: 48,
  
  // Common dimensions
  SAFE_AREA_PADDING: 16,
  BORDER_WIDTH: 1,
  DIVIDER_HEIGHT: 1,
  
  // Screen breakpoints for responsive design
  PHONE_MAX_WIDTH: 480,
  TABLET_MIN_WIDTH: 768,
  DESKTOP_MIN_WIDTH: 1024,
} as const;

// Spacing values following 8px grid system
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

// Border radius values
export const BORDER_RADIUS = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

// Font sizes following type scale
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

// Font weights
export const FONT_WEIGHTS = {
  light: "300" as const,
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

// Line heights for better typography
export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

// Animation durations in milliseconds
export const ANIMATION_DURATION = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
  slowest: 1000,
} as const;

// Animation easing functions
export const ANIMATION_EASING = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // Custom easing curves
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
} as const;

// Z-index layers for proper stacking
export const Z_INDEX = {
  base: 0,
  elevated: 10,
  overlay: 100,
  modal: 1000,
  popover: 1100,
  tooltip: 1200,
  notification: 1300,
  maximum: 9999,
} as const;

// Shadow configurations for depth
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xlarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// Opacity levels for consistency
export const OPACITY = {
  transparent: 0,
  faint: 0.1,
  light: 0.2,
  medium: 0.5,
  strong: 0.7,
  opaque: 1,
} as const;

// Common icon sizes
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

// Button configurations
export const BUTTON_VARIANTS = {
  sizes: {
    sm: {
      height: 32,
      paddingHorizontal: 12,
      fontSize: FONT_SIZES.sm,
      borderRadius: BORDER_RADIUS.md,
    },
    md: {
      height: 40,
      paddingHorizontal: 16,
      fontSize: FONT_SIZES.md,
      borderRadius: BORDER_RADIUS.lg,
    },
    lg: {
      height: 48,
      paddingHorizontal: 24,
      fontSize: FONT_SIZES.lg,
      borderRadius: BORDER_RADIUS.lg,
    },
    xl: {
      height: 56,
      paddingHorizontal: 32,
      fontSize: FONT_SIZES.xl,
      borderRadius: BORDER_RADIUS.xl,
    },
  },
} as const;

// Input field configurations
export const INPUT_VARIANTS = {
  sizes: {
    sm: {
      height: 36,
      paddingHorizontal: 12,
      fontSize: FONT_SIZES.sm,
      borderRadius: BORDER_RADIUS.md,
    },
    md: {
      height: 44,
      paddingHorizontal: 16,
      fontSize: FONT_SIZES.md,
      borderRadius: BORDER_RADIUS.lg,
    },
    lg: {
      height: 52,
      paddingHorizontal: 20,
      fontSize: FONT_SIZES.lg,
      borderRadius: BORDER_RADIUS.lg,
    },
  },
} as const;

// Card configurations
export const CARD_VARIANTS = {
  padding: {
    sm: SPACING.sm,
    md: SPACING.md,
    lg: SPACING.lg,
  },
  borderRadius: {
    sm: BORDER_RADIUS.sm,
    md: BORDER_RADIUS.lg,
    lg: BORDER_RADIUS.xl,
  },
  shadow: {
    none: SHADOWS.none,
    subtle: SHADOWS.small,
    moderate: SHADOWS.medium,
    strong: SHADOWS.large,
  },
} as const;

// Layout breakpoints for responsive design
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
} as const;

// Grid system
export const GRID = {
  columns: 12,
  gutterWidth: SPACING.md,
  containerMaxWidth: 1200,
  containerPadding: SPACING.lg,
} as const;