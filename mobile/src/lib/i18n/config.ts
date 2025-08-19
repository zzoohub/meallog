import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en-US.json';
import ko from './locales/ko.json';

// Language detection configuration
const LANGUAGE_STORAGE_KEY = 'user-language';

// Language detector for React Native with AsyncStorage
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (language: string) => void) => {
    try {
      // First, try to get stored language preference
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage) {
        callback(storedLanguage);
        return;
      }
      
      // Fallback to device locale
      const deviceLocale = Localization.getLocales()[0];
      let detectedLanguage = 'en'; // Default fallback
      
      if (deviceLocale) {
        // Map device locale to supported languages
        if (deviceLocale.languageCode === 'ko') {
          detectedLanguage = 'ko';
        } else if (deviceLocale.languageCode === 'en') {
          detectedLanguage = 'en';
        }
      }
      
      callback(detectedLanguage);
    } catch (error) {
      console.warn('Language detection failed, using fallback:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.warn('Failed to cache user language:', error);
    }
  },
};

// i18next configuration
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    // Resources
    resources: {
      'en-US': { translation: en },
      'en': { translation: en }, // Alias for en-US
      'ko': { translation: ko },
    },
    
    // Language configuration
    fallbackLng: 'en',
    supportedLngs: ['en-US', 'en', 'ko'],
    
    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Performance optimizations for mobile
    debug: __DEV__,
    
    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
      format: (value, format) => {
        if (format === 'number') {
          return new Intl.NumberFormat(i18n.language).format(value);
        }
        if (format === 'currency') {
          const currencyCode = i18n.language === 'ko' ? 'KRW' : 'USD';
          return new Intl.NumberFormat(i18n.language, {
            style: 'currency',
            currency: currencyCode,
          }).format(value);
        }
        return value;
      },
    },
    
    // React configuration
    react: {
      useSuspense: false, // Disable suspense to avoid loading issues on mobile
    },
    
    // Cache configuration for better performance
    saveMissing: __DEV__, // Only save missing translations in development
    missingKeyHandler: (lng, ns, key) => {
      if (__DEV__) {
        console.warn(`Missing translation key: ${key} for language: ${lng}`);
      }
    },
  });

export default i18n;

// Export supported languages for UI components
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

// Export language change utility
export const changeLanguage = async (language: SupportedLanguage) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

// Export current language getter
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

// Export direction support for RTL languages (future-proofing)
export const isRTL = (language?: string): boolean => {
  const lang = language || i18n.language;
  // Add RTL language codes as needed
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(lang.split('-')[0]);
};