// Core exports for better tree-shaking and module resolution

// Types (always import types only)
export type {
  User,
  Post,
  CapturedPhoto,
  CameraSettings,
  PostFormData,
  PaginatedResponse,
  MealType,
  PostPrivacy,
  NutritionInfo,
  Location,
  ApiResponse,
  ThemeColors,
  UserPreferences
} from "./types";

// Constants
export { 
  CAMERA_SETTINGS, 
  APP_CONFIG, 
  API_CONFIG,
  STORAGE_KEYS,
  QUERY_KEYS,
  MUTATION_KEYS 
} from "./constants";

// Utilities
export { 
  formatBytes, 
  formatDate, 
  showAlert, 
  showConfirmAlert,
  getCurrentMealType,
  validateEmail,
  validatePassword 
} from "./utils";

// Design System
export { 
  tokens, 
  lightTheme,
  darkTheme,
  createSpacing,
  createElevation,
  textStyles,
  componentStyles
} from "./styles/tokens";
export type { Theme } from "./styles/tokens";

// Components (organized by category)
export { Button } from "./components/ui/Button";
export { Card } from "./components/ui/Card";
export { LoadingState } from "./components/feedback/LoadingState";
export { ErrorState } from "./components/feedback/ErrorState";

// Domains (feature-based exports)
// Camera moved to orbital components
// export { TakePicture } from "./domains/posts";  // TODO: Implement posts domain
// export { usePosts } from "./domains/posts";    // TODO: Implement posts domain
export { useAuthStore } from "./domains/auth/stores/authStore";
export { useSettingsStore } from "./domains/settings/stores/settingsStore";

// Core libraries
export { default as i18n } from "./lib/i18n/config";
export { useTranslation, useI18n } from "./lib/i18n/hooks";
