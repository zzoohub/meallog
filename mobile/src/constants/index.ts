// Re-export all constants from organized modules
export * from './app';
export * from './ui';
export * from './colors';

// Legacy exports for backward compatibility
export { APP_CONFIG, API_CONFIG, STORAGE_KEYS, FEATURE_FLAGS } from './app';
export { BRAND_COLORS, LIGHT_THEME_COLORS, DARK_THEME_COLORS } from './colors';
export { SPACING, BORDER_RADIUS, FONT_SIZES, ANIMATION_DURATION } from './ui';

// Camera settings (moved to app.ts but keeping for backward compatibility)
export const CAMERA_SETTINGS = {
  DEFAULT_QUALITY: 0.8,
  MAX_PHOTOS_PER_POST: 5,
  PHOTO_COMPRESSION: 0.7,
  THUMBNAIL_SIZE: 150,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Meal types
export const MEAL_TYPES = {
  BREAKFAST: "breakfast",
  LUNCH: "lunch",
  DINNER: "dinner",
  SNACK: "snack",
} as const;

// Privacy settings
export const PRIVACY_LEVELS = {
  PUBLIC: "public",
  FRIENDS: "friends",
  PRIVATE: "private",
} as const;

// User messages (internationalized versions should be used in production)
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network connection failed. Please check your internet connection.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  USER_NOT_FOUND: "User not found.",
  EMAIL_ALREADY_EXISTS: "Email address is already registered.",
  USERNAME_ALREADY_EXISTS: "Username is already taken.",
  // Phone auth errors
  INVALID_PHONE_NUMBER: "Please enter a valid phone number.",
  INVALID_VERIFICATION_CODE: "Please enter a valid 6-digit code.",
  VERIFICATION_CODE_EXPIRED: "Verification code has expired. Please request a new one.",
  PHONE_ALREADY_EXISTS: "This phone number is already registered.",
  SMS_SEND_FAILED: "Failed to send verification code. Please try again.",
  SMS_VERIFICATION_FAILED: "Verification failed. Please check the code and try again.",
  TOO_MANY_ATTEMPTS: "Too many attempts. Please wait 15 minutes and try again.",
  // General errors
  CAMERA_PERMISSION_DENIED: "Camera permission is required to take photos.",
  PHOTO_LIBRARY_PERMISSION_DENIED: "Photo library access is required to select photos.",
  PHOTO_CAPTURE_FAILED: "Failed to capture photo. Please try again.",
  UPLOAD_FAILED: "Failed to upload photo. Please try again.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PHOTO_CAPTURED: "Photo captured successfully!",
  POST_CREATED: "Post created successfully!",
  POST_UPDATED: "Post updated successfully!",
  POST_DELETED: "Post deleted successfully!",
  PROFILE_UPDATED: "Profile updated successfully!",
  PASSWORD_CHANGED: "Password changed successfully!",
  // Phone auth success
  SMS_SENT: "Verification code sent!",
  PHONE_VERIFIED: "Phone number verified successfully!",
  LOGIN_SUCCESS: "Welcome back!",
} as const;

// Domain-specific constants

// Query keys for React Query
export const QUERY_KEYS = {
  POSTS: "posts",
  POST_DETAIL: "post-detail",
  USER_PROFILE: "user-profile",
  FEED: "feed",
  TIMELINE: "timeline",
  SEARCH: "search",
  NOTIFICATIONS: "notifications",
} as const;

// Mutation keys for React Query
export const MUTATION_KEYS = {
  CREATE_POST: "create-post",
  UPDATE_POST: "update-post",
  DELETE_POST: "delete-post",
  LIKE_POST: "like-post",
  UNLIKE_POST: "unlike-post",
  FOLLOW_USER: "follow-user",
  UNFOLLOW_USER: "unfollow-user",
  UPDATE_PROFILE: "update-profile",
} as const;

// Haptic feedback types (for iOS)
export const HAPTIC_TYPES = {
  LIGHT: "light",
  MEDIUM: "medium",
  HEAVY: "heavy",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
} as const;
