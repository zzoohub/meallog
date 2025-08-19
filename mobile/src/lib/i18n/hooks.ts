import { useTranslation, UseTranslationOptions } from 'react-i18next';
import { useMemo } from 'react';
import { getCurrentLanguage, isRTL } from './config';

/**
 * Enhanced useTranslation hook with food-specific utilities
 */
export const useI18n = (ns?: string, options?: UseTranslationOptions<any>) => {
  const { t, i18n, ready } = useTranslation(ns, options);
  
  const currentLanguage = getCurrentLanguage();
  const isReady = ready;
  const isRightToLeft = isRTL(currentLanguage);
  
  // Memoized formatting functions for better performance
  const formatters = useMemo(() => ({
    // Format calories with proper locale
    calories: (count: number): string => t('common.calories', { count }),
    
    // Format likes count with proper pluralization
    likes: (count: number): string => t('common.likes', { count }),
    
    // Format numbers with locale-specific formatting
    number: (value: number): string => {
      return new Intl.NumberFormat(currentLanguage).format(value);
    },
    
    // Format currency with locale-specific formatting
    currency: (value: number): string => {
      const currencyCode = currentLanguage === 'ko' ? 'KRW' : 'USD';
      return new Intl.NumberFormat(currentLanguage, {
        style: 'currency',
        currency: currencyCode,
      }).format(value);
    },
    
    // Format date with locale-specific formatting
    date: (date: Date, options?: Intl.DateTimeFormatOptions): string => {
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      return new Intl.DateTimeFormat(currentLanguage, { ...defaultOptions, ...options }).format(date);
    },
    
    // Format time with locale-specific formatting
    time: (date: Date, options?: Intl.DateTimeFormatOptions): string => {
      const defaultOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
      };
      return new Intl.DateTimeFormat(currentLanguage, { ...defaultOptions, ...options }).format(date);
    },
    
    // Format time ago with proper Korean/English patterns
    timeAgo: (date: Date): string => {
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return t('discover.social.timeAgo.now');
      } else if (diffInMinutes < 60) {
        return t('discover.social.timeAgo.minute', { count: diffInMinutes });
      } else if (diffInMinutes < 1440) { // Less than 24 hours
        const hours = Math.floor(diffInMinutes / 60);
        return t('discover.social.timeAgo.hour', { count: hours });
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return t('discover.social.timeAgo.day', { count: days });
      }
    },
  }), [t, currentLanguage]);
  
  // Food-specific translation helpers
  const foodHelpers = useMemo(() => ({
    mealType: (type: 'breakfast' | 'lunch' | 'dinner' | 'snack'): string => {
      return t(`timeline.mealTypes.${type}`);
    },
    
    category: (category: 'all' | 'healthy' | 'quick' | 'comfort' | 'breakfast' | 'lunch' | 'dinner'): string => {
      return t(`discover.categories.${category}`);
    },
    
    period: (period: 'day' | 'week' | 'month'): string => {
      return t(`timeline.periods.${period}`);
    },
    
    stat: (stat: 'meals' | 'avgCalories' | 'goalProgress'): string => {
      return t(`timeline.stats.${stat}`);
    },
  }), [t]);
  
  return {
    t,
    i18n,
    ready: isReady,
    language: currentLanguage,
    isRTL: isRightToLeft,
    format: formatters,
    food: foodHelpers,
  };
};

/**
 * Hook for navigation-specific translations
 */
export const useNavigationI18n = () => {
  const { t } = useI18n();
  
  return useMemo(() => ({
    camera: t('navigation.camera'),
    timeline: t('navigation.timeline'),
    discover: t('navigation.discover'),
  }), [t]);
};

/**
 * Hook for camera-specific translations
 */
export const useCameraI18n = () => {
  const { t } = useI18n();
  
  return useMemo(() => ({
    title: t('camera.title'),
    subtitle: t('camera.subtitle'),
    quickHint: t('camera.quickHint'),
    hintText: t('camera.hintText'),
    capturingText: t('camera.capturingText'),
    preparing: t('camera.preparing'),
    flip: t('camera.flip'),
    discover: t('camera.discover'),
    welcome: {
      title: t('camera.welcome.title'),
      message: t('camera.welcome.message'),
      enableCamera: t('camera.welcome.enableCamera'),
    },
    permissions: {
      title: t('camera.permissions.title'),
      message: t('camera.permissions.message'),
      cancel: t('camera.permissions.cancel'),
      openSettings: t('camera.permissions.openSettings'),
    },
    capture: {
      success: t('camera.capture.success'),
      successMessage: t('camera.capture.successMessage'),
      viewTimeline: t('camera.capture.viewTimeline'),
      error: t('camera.capture.error'),
      errorMessage: t('camera.capture.errorMessage'),
    },
  }), [t]);
};

/**
 * Hook for timeline-specific translations
 */
export const useTimelineI18n = () => {
  const { t, format, food } = useI18n();
  
  return useMemo(() => ({
    title: t('timeline.title'),
    thisWeek: t('timeline.thisWeek'),
    recentMeals: t('timeline.recentMeals'),
    quickCapture: t('timeline.quickCapture'),
    today: t('timeline.dates.today'),
    yesterday: t('timeline.dates.yesterday'),
    mealType: food.mealType,
    period: food.period,
    stat: food.stat,
    formatCalories: format.calories,
    formatTime: format.time,
  }), [t, format, food]);
};

/**
 * Hook for discover/feeds-specific translations
 */
export const useDiscoverI18n = () => {
  const { t, format, food } = useI18n();
  
  return useMemo(() => ({
    title: t('discover.title'),
    subtitle: t('discover.subtitle'),
    follow: t('discover.social.follow'),
    following: t('discover.social.following'),
    category: food.category,
    formatCalories: format.calories,
    formatTimeAgo: format.timeAgo,
    formatLikes: format.likes,
  }), [t, format, food]);
};

/**
 * Hook for common UI translations
 */
export const useCommonI18n = () => {
  const { t, format } = useI18n();
  
  return useMemo(() => ({
    loading: t('common.loading'),
    retry: t('common.retry'),
    cancel: t('common.cancel'),
    save: t('common.save'),
    delete: t('common.delete'),
    edit: t('common.edit'),
    ok: t('common.ok'),
    yes: t('common.yes'),
    no: t('common.no'),
    settings: t('common.settings'),
    language: t('common.language'),
    about: t('common.about'),
    formatNumber: format.number,
    formatCurrency: format.currency,
    formatDate: format.date,
  }), [t, format]);
};

/**
 * Hook for error message translations
 */
export const useErrorI18n = () => {
  const { t } = useI18n();
  
  return useMemo(() => ({
    networkError: t('errors.networkError'),
    genericError: t('errors.genericError'),
    cameraError: t('errors.cameraError'),
    storageError: t('errors.storageError'),
  }), [t]);
};

// Export all hooks for easy access
export { useTranslation } from 'react-i18next';