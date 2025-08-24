/**
 * Color System
 * Comprehensive color palette for the MealLog app following design system principles
 */

// Brand colors - primary identity colors
export const BRAND_COLORS = {
  PRIMARY: "#FF6B35",
  PRIMARY_LIGHT: "#FF8A5B",
  PRIMARY_DARK: "#E55A2B",
  PRIMARY_DARKER: "#CC4A1C",
  
  SECONDARY: "#4ECDC4",
  SECONDARY_LIGHT: "#6ED8D0",
  SECONDARY_DARK: "#3BA39C",
  SECONDARY_DARKER: "#2A7A75",
  
  ACCENT: "#FFD23F",
  ACCENT_LIGHT: "#FFE066",
  ACCENT_DARK: "#E6BD38",
} as const;

// Semantic colors - for consistent meaning across the app
export const SEMANTIC_COLORS = {
  SUCCESS: "#2ECC71",
  SUCCESS_LIGHT: "#58D68D",
  SUCCESS_DARK: "#27AE60",
  SUCCESS_DARKER: "#1E8449",
  
  WARNING: "#F39C12",
  WARNING_LIGHT: "#F5B041",
  WARNING_DARK: "#D68910",
  WARNING_DARKER: "#B7950B",
  
  ERROR: "#E74C3C",
  ERROR_LIGHT: "#EC7063",
  ERROR_DARK: "#CB4335",
  ERROR_DARKER: "#A93226",
  
  INFO: "#3498DB",
  INFO_LIGHT: "#5DADE2",
  INFO_DARK: "#2980B9",
  INFO_DARKER: "#1F618D",
} as const;

// Neutral colors - grayscale palette
export const NEUTRAL_COLORS = {
  WHITE: "#FFFFFF",
  GRAY_50: "#F8F9FA",
  GRAY_100: "#F1F3F4",
  GRAY_200: "#E8EAED",
  GRAY_300: "#DADCE0",
  GRAY_400: "#BDC1C6",
  GRAY_500: "#9AA0A6",
  GRAY_600: "#80868B",
  GRAY_700: "#5F6368",
  GRAY_800: "#3C4043",
  GRAY_900: "#202124",
  BLACK: "#000000",
} as const;

// Light theme color mappings
export const LIGHT_THEME_COLORS = {
  // Brand
  primary: BRAND_COLORS.PRIMARY,
  primaryLight: BRAND_COLORS.PRIMARY_LIGHT,
  primaryDark: BRAND_COLORS.PRIMARY_DARK,
  secondary: BRAND_COLORS.SECONDARY,
  
  // Backgrounds
  background: NEUTRAL_COLORS.WHITE,
  backgroundSecondary: NEUTRAL_COLORS.GRAY_50,
  surface: NEUTRAL_COLORS.WHITE,
  surfaceSecondary: NEUTRAL_COLORS.GRAY_100,
  
  // Text
  text: NEUTRAL_COLORS.GRAY_900,
  textSecondary: NEUTRAL_COLORS.GRAY_600,
  textTertiary: NEUTRAL_COLORS.GRAY_500,
  textDisabled: NEUTRAL_COLORS.GRAY_400,
  textInverse: NEUTRAL_COLORS.WHITE,
  
  // Borders and dividers
  border: NEUTRAL_COLORS.GRAY_300,
  borderLight: NEUTRAL_COLORS.GRAY_200,
  borderDark: NEUTRAL_COLORS.GRAY_400,
  divider: NEUTRAL_COLORS.GRAY_200,
  
  // Interactive elements
  link: BRAND_COLORS.PRIMARY,
  linkHover: BRAND_COLORS.PRIMARY_DARK,
  linkVisited: BRAND_COLORS.PRIMARY_DARKER,
  
  // States
  success: SEMANTIC_COLORS.SUCCESS,
  warning: SEMANTIC_COLORS.WARNING,
  error: SEMANTIC_COLORS.ERROR,
  info: SEMANTIC_COLORS.INFO,
  
  // Overlays
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.2)",
  overlayDark: "rgba(0, 0, 0, 0.7)",
  
  // Shadows
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowMedium: "rgba(0, 0, 0, 0.15)",
  shadowStrong: "rgba(0, 0, 0, 0.25)",
} as const;

// Dark theme color mappings
export const DARK_THEME_COLORS = {
  // Brand (slightly adjusted for dark theme)
  primary: BRAND_COLORS.PRIMARY,
  primaryLight: BRAND_COLORS.PRIMARY_LIGHT,
  primaryDark: BRAND_COLORS.PRIMARY_DARK,
  secondary: BRAND_COLORS.SECONDARY,
  
  // Backgrounds
  background: NEUTRAL_COLORS.BLACK,
  backgroundSecondary: NEUTRAL_COLORS.GRAY_900,
  surface: "#1C1C1E", // iOS dark surface
  surfaceSecondary: "#2C2C2E", // iOS elevated dark surface
  
  // Text
  text: NEUTRAL_COLORS.WHITE,
  textSecondary: "#8E8E93", // iOS secondary label
  textTertiary: "#636366", // iOS tertiary label
  textDisabled: "#48484A", // iOS quaternary label
  textInverse: NEUTRAL_COLORS.BLACK,
  
  // Borders and dividers
  border: "#38383A", // iOS separator
  borderLight: "#48484A",
  borderDark: "#636366",
  divider: "#38383A",
  
  // Interactive elements
  link: BRAND_COLORS.PRIMARY_LIGHT,
  linkHover: BRAND_COLORS.PRIMARY,
  linkVisited: BRAND_COLORS.PRIMARY_DARK,
  
  // States (slightly brighter for dark theme)
  success: SEMANTIC_COLORS.SUCCESS_LIGHT,
  warning: SEMANTIC_COLORS.WARNING_LIGHT,
  error: SEMANTIC_COLORS.ERROR_LIGHT,
  info: SEMANTIC_COLORS.INFO_LIGHT,
  
  // Overlays
  overlay: "rgba(0, 0, 0, 0.7)",
  overlayLight: "rgba(0, 0, 0, 0.4)",
  overlayDark: "rgba(0, 0, 0, 0.9)",
  
  // Shadows (for dark theme, we use light shadows)
  shadow: "rgba(255, 255, 255, 0.1)",
  shadowMedium: "rgba(255, 255, 255, 0.15)",
  shadowStrong: "rgba(255, 255, 255, 0.25)",
} as const;

// Food category colors for visual distinction
export const FOOD_CATEGORY_COLORS = {
  PROTEIN: "#E74C3C",      // Red
  CARBS: "#F39C12",        // Orange
  VEGETABLES: "#2ECC71",   // Green
  FRUITS: "#9B59B6",       // Purple
  DAIRY: "#3498DB",        // Blue
  FATS: "#F1C40F",         // Yellow
  SNACKS: "#E67E22",       // Orange-red
  BEVERAGES: "#1ABC9C",    // Teal
  DESSERTS: "#E91E63",     // Pink
  OTHER: "#95A5A6",        // Gray
} as const;

// Meal type colors
export const MEAL_TYPE_COLORS = {
  BREAKFAST: "#F39C12",    // Orange - morning energy
  LUNCH: "#2ECC71",        // Green - midday freshness
  DINNER: "#E74C3C",       // Red - evening warmth
  SNACK: "#9B59B6",        // Purple - playful
} as const;

// Nutrition colors for charts and indicators
export const NUTRITION_COLORS = {
  CALORIES: "#FF6B35",     // Primary brand color
  PROTEIN: "#E74C3C",      // Red
  CARBS: "#F39C12",        // Orange
  FAT: "#F1C40F",          // Yellow
  FIBER: "#2ECC71",        // Green
  SUGAR: "#E91E63",        // Pink
  SODIUM: "#9B59B6",       // Purple
} as const;

// Chart colors for data visualization
export const CHART_COLORS = [
  BRAND_COLORS.PRIMARY,
  BRAND_COLORS.SECONDARY,
  SEMANTIC_COLORS.SUCCESS,
  SEMANTIC_COLORS.WARNING,
  SEMANTIC_COLORS.INFO,
  BRAND_COLORS.ACCENT,
  SEMANTIC_COLORS.ERROR,
  "#9B59B6", // Purple
  "#1ABC9C", // Teal
  "#34495E", // Dark blue-gray
] as const;

// Gradient definitions for backgrounds and effects
export const GRADIENTS = {
  PRIMARY: [BRAND_COLORS.PRIMARY_LIGHT, BRAND_COLORS.PRIMARY_DARK],
  SECONDARY: [BRAND_COLORS.SECONDARY_LIGHT, BRAND_COLORS.SECONDARY_DARK],
  SUCCESS: [SEMANTIC_COLORS.SUCCESS_LIGHT, SEMANTIC_COLORS.SUCCESS_DARK],
  WARNING: [SEMANTIC_COLORS.WARNING_LIGHT, SEMANTIC_COLORS.WARNING_DARK],
  ERROR: [SEMANTIC_COLORS.ERROR_LIGHT, SEMANTIC_COLORS.ERROR_DARK],
  INFO: [SEMANTIC_COLORS.INFO_LIGHT, SEMANTIC_COLORS.INFO_DARK],
  SUNSET: [BRAND_COLORS.ACCENT, BRAND_COLORS.PRIMARY],
  OCEAN: [BRAND_COLORS.SECONDARY, SEMANTIC_COLORS.INFO],
  NEUTRAL: [NEUTRAL_COLORS.GRAY_100, NEUTRAL_COLORS.GRAY_300],
  DARK: [NEUTRAL_COLORS.GRAY_800, NEUTRAL_COLORS.BLACK],
} as const;

// Color utilities type definitions
export type ColorTheme = typeof LIGHT_THEME_COLORS | typeof DARK_THEME_COLORS;
export type BrandColor = keyof typeof BRAND_COLORS;
export type SemanticColor = keyof typeof SEMANTIC_COLORS;
export type NeutralColor = keyof typeof NEUTRAL_COLORS;