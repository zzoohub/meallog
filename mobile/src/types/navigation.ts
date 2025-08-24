import { ParamListBase } from '@react-navigation/native';

// Define all screen parameters
export interface RootStackParamList extends ParamListBase {
  '(main)': undefined;
  'meal-detail': {
    mealId?: string;
    photoUri?: string;
    isNew: string;
  };
  'ai-coach': undefined;
  profile: undefined;
  'challenge-detail': {
    challengeId: string;
  };
  settings: undefined;
  'settings/account': undefined;
  'settings/display': undefined;
  'settings/notifications': undefined;
  'settings/privacy': undefined;
  'settings/goals': undefined;
  'settings/data': undefined;
  'meal-history': undefined;
}

export interface MainTabParamList extends ParamListBase {
  index: undefined;
}

// Type-safe navigation helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  params: RootStackParamList[T];
  navigation: any; // Would be properly typed with navigation library
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = {
  params: MainTabParamList[T];
  navigation: any;
};

// Navigation options for each screen
export interface NavigationOptions {
  headerShown?: boolean;
  presentation?: 'card' | 'modal' | 'transparentModal';
  animation?: 'slide_from_right' | 'slide_from_left' | 'slide_from_bottom' | 'fade' | 'none';
  gestureEnabled?: boolean;
  animationDuration?: number;
}

export const SCREEN_OPTIONS: Record<keyof RootStackParamList, NavigationOptions> = {
  '(main)': {
    gestureEnabled: false,
  },
  'meal-detail': {
    presentation: 'modal',
    animation: 'slide_from_bottom',
  },
  'ai-coach': {
    presentation: 'modal',
    animation: 'slide_from_left',
  },
  profile: {
    presentation: 'modal',
  },
  'challenge-detail': {
    presentation: 'modal',
  },
  settings: {
    animation: 'slide_from_right',
    gestureEnabled: true,
  },
  'settings/account': {
    animation: 'slide_from_right',
    gestureEnabled: true,
  },
  'settings/display': {
    animation: 'slide_from_right',
    gestureEnabled: true,
  },
  'settings/notifications': {
    animation: 'slide_from_right',
    gestureEnabled: true,
  },
  'settings/privacy': {
    animation: 'slide_from_right',
    gestureEnabled: true,
  },
  'settings/goals': {
    animation: 'slide_from_right',
    gestureEnabled: true,
  },
  'settings/data': {
    animation: 'slide_from_right',
    gestureEnabled: true,
  },
  'meal-history': {
    animation: 'slide_from_right',
    gestureEnabled: true,
  },
};

// Screen performance configurations
export interface ScreenPerformanceConfig {
  lazy?: boolean;
  preload?: boolean;
  freezeOnBlur?: boolean;
  removeClippedSubviews?: boolean;
}

export const SCREEN_PERFORMANCE: Record<keyof RootStackParamList, ScreenPerformanceConfig> = {
  '(main)': {
    lazy: false, // Main screen
    preload: false,
    removeClippedSubviews: true,
  },
  'meal-detail': {
    lazy: true,
    preload: false,
    freezeOnBlur: true,
  },
  'ai-coach': {
    lazy: true,
    preload: false,
    freezeOnBlur: true,
  },
  profile: {
    lazy: true,
    preload: false,
    freezeOnBlur: true,
  },
  'challenge-detail': {
    lazy: true,
    preload: false,
    freezeOnBlur: true,
  },
  settings: {
    lazy: true,
    preload: false,
  },
  'settings/account': {
    lazy: true,
    preload: false,
  },
  'settings/display': {
    lazy: true,
    preload: false,
  },
  'settings/notifications': {
    lazy: true,
    preload: false,
  },
  'settings/privacy': {
    lazy: true,
    preload: false,
  },
  'settings/goals': {
    lazy: true,
    preload: false,
  },
  'settings/data': {
    lazy: true,
    preload: false,
  },
  'meal-history': {
    lazy: true,
    preload: false,
    removeClippedSubviews: true,
  },
};