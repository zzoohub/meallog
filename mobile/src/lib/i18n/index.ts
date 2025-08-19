// Main i18n configuration - import this in your app root
import './config';

// Export configuration utilities
export { 
  SUPPORTED_LANGUAGES, 
  changeLanguage, 
  getCurrentLanguage, 
  isRTL,
  type SupportedLanguage 
} from './config';

// Export hooks
export {
  useI18n,
  useNavigationI18n,
  useCameraI18n,
  useTimelineI18n,
  useDiscoverI18n,
  useCommonI18n,
  useErrorI18n,
  useTranslation,
} from './hooks';

// Re-export react-i18next for advanced usage
export { Trans, withTranslation } from 'react-i18next';