/**
 * Enhanced i18n system with type safety and modular architecture
 * 
 * Features:
 * - Type-safe translation keys
 * - Modular translation files
 * - Domain-specific hooks
 * - Development tools
 * - Performance optimizations
 */

// Initialize i18n configuration
import './config';

// Export configuration utilities
export { 
  SUPPORTED_LANGUAGES, 
  changeLanguage, 
  getCurrentLanguage, 
  getCurrentLanguageConfig,
  isRTL,
  i18nInstance,
  type SupportedLanguage 
} from './config';

// Export type-safe hooks
export {
  useI18n,
  useNavigationI18n,
  useCameraI18n,
  useTimelineI18n,
  useDiscoverI18n,
  useCommonI18n,
  useErrorI18n,
  useMealDetailI18n,
  useProgressI18n,
  useAICoachI18n,
  useSettingsI18n,
  useTranslation,
} from './hooks';

// Export TypeScript types
export type {
  TranslationResources,
  TranslationKey,
  NavigationTranslations,
  CameraTranslations,
  TimelineTranslations,
  DiscoverTranslations,
  ProgressTranslations,
  AICoachTranslations,
  MealDetailTranslations,
  CommonTranslations,
  ErrorTranslations,
  SettingsTranslations,
  FormattersType,
  FoodHelpersType,
  MealType,
  CategoryType,
  PeriodType,
  StatType,
} from './types';

// Export development tools (only in development)
export {
  validateTranslationCompleteness,
  extractTranslationKeys,
  findUnusedKeys,
  findMissingKeys,
  generateTypeDefinitions,
  getTranslationStats,
  validateKeyPatterns,
} from './dev-tools';

// Re-export react-i18next for advanced usage
export { Trans, withTranslation } from 'react-i18next';

// Migration utilities for backward compatibility
export const LEGACY_HOOKS = {
  useNavigationI18n: 'Use useNavigationI18n from hooks.v2',
  useCameraI18n: 'Use useCameraI18n from hooks.v2',
  useTimelineI18n: 'Use useTimelineI18n from hooks.v2',
  useDiscoverI18n: 'Use useDiscoverI18n from hooks.v2',
  useCommonI18n: 'Use useCommonI18n from hooks.v2',
  useErrorI18n: 'Use useErrorI18n from hooks.v2',
} as const;