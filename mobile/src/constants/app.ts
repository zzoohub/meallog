/**
 * App Configuration Constants
 * All app-level configuration values and constants
 */

// App metadata
export const APP_CONFIG = {
  NAME: "MealLog",
  VERSION: "1.0.0",
  BUILD_NUMBER: 1,
  API_VERSION: "v1",
  SCHEME: "meallog",
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ ? "http://localhost:3000/api" : "https://api.meallog.app",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_CONCURRENT_REQUESTS: 5,
} as const;

// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  // User data
  USER_TOKEN: "user_token",
  USER_DATA: "user_data",
  USER_PREFERENCES: "user_preferences",
  
  // App settings
  LANGUAGE: "user_language",
  THEME: "user_theme",
  ONBOARDING_COMPLETED: "onboarding_completed",
  
  // Permissions
  CAMERA_PERMISSIONS_REQUESTED: "camera_permissions_requested",
  PHOTO_LIBRARY_PERMISSIONS_REQUESTED: "photo_library_permissions_requested",
  LOCATION_PERMISSIONS_REQUESTED: "location_permissions_requested",
  
  // Cache
  RECENT_PHOTOS: "recent_photos",
  MEAL_CACHE: "meal_cache",
  USER_STATS_CACHE: "user_stats_cache",
  
  // Auth
  PHONE_AUTH_TOKEN: "phone_auth_token",
  LAST_PHONE_NUMBER: "last_phone_number",
  BIOMETRIC_ENABLED: "biometric_enabled",
  
  // Settings by category
  NOTIFICATION_SETTINGS: "notification_settings",
  PRIVACY_SETTINGS: "privacy_settings",
  DISPLAY_SETTINGS: "display_settings",
  GOAL_SETTINGS: "goal_settings",
  CAMERA_SETTINGS: "camera_settings",
  
  // Performance
  PERFORMANCE_METRICS: "performance_metrics",
  CRASH_REPORTS: "crash_reports",
} as const;

// Feature flags for gradual rollouts and A/B testing
export const FEATURE_FLAGS = {
  // Core features
  AI_FOOD_RECOGNITION: true,
  SOCIAL_FEATURES: true,
  LOCATION_TRACKING: true,
  BIOMETRIC_AUTH: true,
  
  // Experimental features
  VOICE_NOTES: false,
  MEAL_SHARING: true,
  NUTRITION_COACHING: true,
  CALORIE_COUNTER: true,
  
  // Performance features
  IMAGE_OPTIMIZATION: true,
  LAZY_LOADING: true,
  PREFETCHING: true,
  CACHING: true,
  
  // Analytics and tracking
  ANALYTICS: !__DEV__,
  CRASH_REPORTING: !__DEV__,
  PERFORMANCE_MONITORING: !__DEV__,
  
  // Development features
  DEBUG_MENU: __DEV__,
  REDUX_LOGGER: __DEV__,
  FLIPPER_ENABLED: __DEV__,
} as const;

// Regular expressions for validation
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  VERIFICATION_CODE: /^\d{6}$/,
  HASHTAG: /^#[a-zA-Z0-9_]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
} as const;

// Limits and constraints
export const LIMITS = {
  // User input limits
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  BIO_MAX_LENGTH: 500,
  POST_CONTENT_MAX_LENGTH: 2000,
  
  // Media limits
  MAX_PHOTOS_PER_POST: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_DURATION: 60 * 1000, // 60 seconds
  
  // API limits
  MAX_CONCURRENT_UPLOADS: 3,
  MAX_RETRY_ATTEMPTS: 3,
  REQUEST_TIMEOUT: 30 * 1000, // 30 seconds
  
  // Performance limits
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_MEMORY_USAGE: 200 * 1024 * 1024, // 200MB
  MAX_FPS: 60,
} as const;

// Default values
export const DEFAULTS = {
  LANGUAGE: "en" as const,
  THEME: "system" as const,
  NOTIFICATION_PREFERENCES: {
    posts: true,
    likes: true,
    comments: true,
    follows: true,
    aiTips: true,
    weeklyReports: true,
  },
  PRIVACY_PREFERENCES: {
    showLocation: false,
    allowAnalytics: true,
    shareWithFriends: true,
    publicProfile: false,
  },
  CAMERA_PREFERENCES: {
    quality: 0.8,
    autoFocus: true,
    flashMode: "auto" as const,
    saveToGallery: true,
  },
} as const;

// App URLs and deep links
export const APP_URLS = {
  TERMS_OF_SERVICE: "https://meallog.app/terms",
  PRIVACY_POLICY: "https://meallog.app/privacy",
  SUPPORT: "https://meallog.app/support",
  FEEDBACK: "https://meallog.app/feedback",
  APP_STORE: "https://apps.apple.com/app/meallog",
  GOOGLE_PLAY: "https://play.google.com/store/apps/details?id=com.meallog.app",
  WEBSITE: "https://meallog.app",
} as const;

// Deep link schemes
export const DEEP_LINKS = {
  MEAL_DETAIL: "meallog://meal-detail",
  PROFILE: "meallog://profile",
  SETTINGS: "meallog://settings",
  CAMERA: "meallog://camera",
  AI_COACH: "meallog://ai-coach",
} as const;

// Environment-specific configurations
export const ENV_CONFIG = {
  IS_DEVELOPMENT: __DEV__,
  IS_PRODUCTION: !__DEV__,
  LOG_LEVEL: __DEV__ ? "debug" : "warn",
  ENABLE_DEBUGGER: __DEV__,
  ENABLE_HOT_RELOAD: __DEV__,
} as const;