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

// Theme System
export { useTheme, lightColors, darkColors } from "./lib/theme/useTheme";
export type { ThemeType } from "./lib/theme/useTheme";

// Components (organized by category)
export { Button } from "./components/ui/Button";
export { Card } from "./components/ui/Card";
export { LoadingState } from "./components/feedback/LoadingState";
export { ErrorState } from "./components/feedback/ErrorState";

// Domains (feature-based exports)
export { CameraView } from "./domains/camera";
export { useCamera } from "./domains/camera";
// export { TakePicture } from "./domains/posts";  // TODO: Implement posts domain
// export { usePosts } from "./domains/posts";    // TODO: Implement posts domain
export { useUserStore } from "./domains/user/stores/userStore";
export { useSettingsStore } from "./domains/settings/stores/settingsStore";

// Core libraries
export { default as i18n } from "./lib/i18n/config";
export { useTranslation, useI18n } from "./lib/i18n/hooks";
