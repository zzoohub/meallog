// Core entity types
export interface User {
  id: string;
  username: string;
  email?: string;
  phone: string;
  avatar?: string;
  isLoggedIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  content: string;
  images: string[];
  likes: number;
  isLiked: boolean;
  mealType?: MealType;
  location?: Location;
  nutritionInfo?: NutritionInfo;
  aiAnalysis?: AIAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

// Meal and nutrition related types
export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface AIAnalysis {
  detectedMeals: string[];
  confidence: number;
  estimatedCalories: number;
  mealCategory: MealType;
  ingredients: string[];
  cuisineType?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  restaurantName?: string;
}

// Enums and constants
export enum MealType {
  BREAKFAST = "breakfast",
  LUNCH = "lunch",
  DINNER = "dinner",
  SNACK = "snack",
}

export enum PostPrivacy {
  PUBLIC = "public",
  FRIENDS = "friends",
  PRIVATE = "private",
}

// Camera and media types
export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: any;
}

export interface CameraSettings {
  type: "front" | "back";
  flash: "on" | "off" | "auto";
  quality: number;
}

// UI and component types
export interface BaseComponentProps {
  testID?: string;
  style?: any;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// Phone auth types
export interface PhoneAuthFormData {
  phone: string;
  countryCode: string;
}

export interface VerificationFormData {
  code: string;
}

export interface PostFormData {
  content: string;
  images: string[];
  mealType?: MealType;
  privacy: PostPrivacy;
  location?: Location;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Navigation types (for type-safe routing)
export type RootStackParamList = {
  "(tabs)": undefined;
  "not-found": undefined;
  settings: undefined;
};

export type TabParamList = {
  index: undefined;
  timeline: undefined;
  feeds: undefined;
  "create-post": undefined;
};

// Theme and styling types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface BorderRadius {
  sm: number;
  md: number;
  lg: number;
  full: number;
}

// Analytics and tracking types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

export interface UserPreferences {
  language: "en" | "ko";
  theme: "light" | "dark" | "system";
  notifications: {
    posts: boolean;
    likes: boolean;
    follows: boolean;
  };
  privacy: {
    showLocation: boolean;
    allowAnalytics: boolean;
  };
}

// Performance optimization types
export interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

// Error handling types
export interface AppError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  timestamp: Date;
  userId?: string;
  context?: Record<string, unknown>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: React.ErrorInfo | null;
}

// Accessibility types
export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface GestureHandlerConfig {
  enabled?: boolean;
  shouldCancelWhenOutside?: boolean;
  minPointers?: number;
  maxPointers?: number;
  avgTouches?: boolean;
}

// Platform-specific types
export interface PlatformSpecificStyles<T> {
  ios?: T;
  android?: T;
  web?: T;
  default?: T;
}

// State management types
export interface StoreState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface AsyncAction<T, P = void> {
  pending: boolean;
  fulfilled: boolean;
  rejected: boolean;
  data?: T;
  error?: string;
  meta?: P;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type NonNullable<T> = T extends null | undefined ? never : T;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
