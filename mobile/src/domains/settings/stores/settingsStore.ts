import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, ENV_CONFIG } from '@/constants';
import { optimizedStorage } from '@/lib/storage';
import { performanceMonitor } from '@/lib/performance';

export interface NotificationSettings {
  mealReminders: boolean;
  socialNotifications: boolean;
  progressUpdates: boolean;
  aiInsights: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "07:00"
  };
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  locationSharing: boolean;
  analyticsCollection: boolean;
  crashReporting: boolean;
  dataExport: {
    includePhotos: boolean;
    includeAnalytics: boolean;
    format: 'json' | 'csv';
  };
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ko';
  measurementUnits: 'metric' | 'imperial';
  nutritionDisplay: 'detailed' | 'simple';
  fontSize: 'small' | 'medium' | 'large';
}

export interface GoalSettings {
  dailyCalories: number;
  macroGoals: {
    protein: number; // percentage
    carbs: number; // percentage
    fat: number; // percentage
  };
  mealFrequency: number; // meals per day
  weightGoal: {
    target: number;
    unit: 'kg' | 'lbs';
    timeframe: 'weekly' | 'monthly';
  };
}

export interface CameraSettings {
  quality: 'low' | 'medium' | 'high';
  aiProcessing: boolean;
  autoCapture: boolean;
  flashDefault: 'auto' | 'on' | 'off';
  saveToGallery: boolean;
}

export interface SettingsState {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  display: DisplaySettings;
  goals: GoalSettings;
  camera: CameraSettings;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
  
  // Actions
  updateNotifications: (updates: Partial<NotificationSettings>) => Promise<void>;
  updatePrivacy: (updates: Partial<PrivacySettings>) => Promise<void>;
  updateDisplay: (updates: Partial<DisplaySettings>) => Promise<void>;
  updateGoals: (updates: Partial<GoalSettings>) => Promise<void>;
  updateCamera: (updates: Partial<CameraSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  exportUserData: () => Promise<string>;
  clearError: () => void;
}

const defaultNotifications: NotificationSettings = {
  mealReminders: true,
  socialNotifications: true,
  progressUpdates: true,
  aiInsights: true,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '07:00',
  },
  frequency: 'immediate',
};

const defaultPrivacy: PrivacySettings = {
  profileVisibility: 'friends',
  locationSharing: false,
  analyticsCollection: true,
  crashReporting: true,
  dataExport: {
    includePhotos: true,
    includeAnalytics: false,
    format: 'json',
  },
};

const defaultDisplay: DisplaySettings = {
  theme: 'dark',
  language: 'en',
  measurementUnits: 'metric',
  nutritionDisplay: 'detailed',
  fontSize: 'medium',
};

const defaultGoals: GoalSettings = {
  dailyCalories: 2000,
  macroGoals: {
    protein: 25,
    carbs: 45,
    fat: 30,
  },
  mealFrequency: 3,
  weightGoal: {
    target: 70,
    unit: 'kg',
    timeframe: 'monthly',
  },
};

const defaultCamera: CameraSettings = {
  quality: 'high',
  aiProcessing: true,
  autoCapture: false,
  flashDefault: 'auto',
  saveToGallery: true,
};

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector((set, get) => ({
    notifications: defaultNotifications,
    privacy: defaultPrivacy,
    display: defaultDisplay,
    goals: defaultGoals,
    camera: defaultCamera,
    isLoading: false,
    error: null,

    updateNotifications: async (updates: Partial<NotificationSettings>) => {
      const currentState = get();
      const newSettings = { ...currentState.notifications, ...updates };
      
      // Optimistic update - apply changes immediately
      set({ notifications: newSettings, error: null });
      
      try {
        // Save to storage in background
        await AsyncStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_SETTINGS,
          JSON.stringify(newSettings)
        );
      } catch (error) {
        // Revert on error
        set({ notifications: currentState.notifications });
        const errorMessage = error instanceof Error ? error.message : 'Failed to update notifications';
        set({ error: errorMessage });
        throw error;
      }
    },

    updatePrivacy: async (updates: Partial<PrivacySettings>) => {
      try {
        set({ isLoading: true, error: null });
        
        const newSettings = { ...get().privacy, ...updates };
        
        await AsyncStorage.setItem(
          STORAGE_KEYS.PRIVACY_SETTINGS,
          JSON.stringify(newSettings)
        );
        
        set({ privacy: newSettings, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update privacy settings';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    updateDisplay: async (updates: Partial<DisplaySettings>) => {
      try {
        set({ isLoading: true, error: null });
        
        const newSettings = { ...get().display, ...updates };
        
        await AsyncStorage.setItem(
          STORAGE_KEYS.DISPLAY_SETTINGS,
          JSON.stringify(newSettings)
        );
        
        set({ display: newSettings, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update display settings';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    updateGoals: async (updates: Partial<GoalSettings>) => {
      try {
        set({ isLoading: true, error: null });
        
        const newSettings = { ...get().goals, ...updates };
        
        await AsyncStorage.setItem(
          STORAGE_KEYS.GOAL_SETTINGS,
          JSON.stringify(newSettings)
        );
        
        set({ goals: newSettings, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update goals';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    updateCamera: async (updates: Partial<CameraSettings>) => {
      try {
        set({ isLoading: true, error: null });
        
        const newSettings = { ...get().camera, ...updates };
        
        await AsyncStorage.setItem(
          STORAGE_KEYS.CAMERA_SETTINGS,
          JSON.stringify(newSettings)
        );
        
        set({ camera: newSettings, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update camera settings';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    loadSettings: async () => {
      try {
        set({ isLoading: true, error: null });
        
        const [notifications, privacy, display, goals, camera] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.DISPLAY_SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.GOAL_SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.CAMERA_SETTINGS),
        ]);

        const updates: Partial<SettingsState> = { isLoading: false };

        if (notifications) {
          updates.notifications = { ...defaultNotifications, ...JSON.parse(notifications) };
        }
        if (privacy) {
          updates.privacy = { ...defaultPrivacy, ...JSON.parse(privacy) };
        }
        if (display) {
          updates.display = { ...defaultDisplay, ...JSON.parse(display) };
        }
        if (goals) {
          updates.goals = { ...defaultGoals, ...JSON.parse(goals) };
        }
        if (camera) {
          updates.camera = { ...defaultCamera, ...JSON.parse(camera) };
        }

        set(updates);
      } catch (error) {
        console.error('Failed to load settings from storage:', error);
        set({ isLoading: false });
      }
    },

    resetToDefaults: async () => {
      try {
        set({ isLoading: true, error: null });
        
        // Clear all settings from storage
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATION_SETTINGS),
          AsyncStorage.removeItem(STORAGE_KEYS.PRIVACY_SETTINGS),
          AsyncStorage.removeItem(STORAGE_KEYS.DISPLAY_SETTINGS),
          AsyncStorage.removeItem(STORAGE_KEYS.GOAL_SETTINGS),
          AsyncStorage.removeItem(STORAGE_KEYS.CAMERA_SETTINGS),
        ]);
        
        // Reset to defaults
        set({
          notifications: defaultNotifications,
          privacy: defaultPrivacy,
          display: defaultDisplay,
          goals: defaultGoals,
          camera: defaultCamera,
          isLoading: false,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reset settings';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    exportUserData: async () => {
      const state = get();
      const exportData = {
        settings: {
          notifications: state.notifications,
          privacy: state.privacy,
          display: state.display,
          goals: state.goals,
          camera: state.camera,
        },
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
      
      return JSON.stringify(exportData, null, 2);
    },

      // Batch update for performance when multiple settings change
      batchUpdateSettings: async (updates) => {
        const startTime = performanceMonitor.mark('settings-batch-update');
        
        try {
          set({ isLoading: true, error: null });
          
          const currentState = get();
          const promises: Promise<void>[] = [];
          const newState: Partial<SettingsState> = { lastUpdated: new Date() };
          
          // Prepare updates and storage promises
          if (updates.notifications) {
            newState.notifications = { ...currentState.notifications, ...updates.notifications };
            promises.push(
              AsyncStorage.setItem(
                STORAGE_KEYS.NOTIFICATION_SETTINGS,
                JSON.stringify(newState.notifications)
              )
            );
          }
          
          if (updates.privacy) {
            newState.privacy = { ...currentState.privacy, ...updates.privacy };
            promises.push(
              AsyncStorage.setItem(
                STORAGE_KEYS.PRIVACY_SETTINGS,
                JSON.stringify(newState.privacy)
              )
            );
          }
          
          if (updates.display) {
            newState.display = { ...currentState.display, ...updates.display };
            promises.push(
              AsyncStorage.setItem(
                STORAGE_KEYS.DISPLAY_SETTINGS,
                JSON.stringify(newState.display)
              )
            );
          }
          
          if (updates.goals) {
            newState.goals = { ...currentState.goals, ...updates.goals };
            promises.push(
              AsyncStorage.setItem(
                STORAGE_KEYS.GOAL_SETTINGS,
                JSON.stringify(newState.goals)
              )
            );
          }
          
          if (updates.camera) {
            newState.camera = { ...currentState.camera, ...updates.camera };
            promises.push(
              AsyncStorage.setItem(
                STORAGE_KEYS.CAMERA_SETTINGS,
                JSON.stringify(newState.camera)
              )
            );
          }
          
          // Apply optimistic updates
          set({ ...newState });
          
          // Save all settings in parallel
          await Promise.all(promises);
          
          set({ isLoading: false });
          performanceMonitor.measure('settings-batch-update', startTime);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to batch update settings';
          set({ error: errorMessage, isLoading: false });
          performanceMonitor.measure('settings-batch-update', startTime);
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }))
);

// Auto-save settings changes using debounced storage for better performance
const debouncedPrivacySave = optimizedStorage.createDebouncedSetter<PrivacySettings>(STORAGE_KEYS.PRIVACY_SETTINGS);
const debouncedDisplaySave = optimizedStorage.createDebouncedSetter<DisplaySettings>(STORAGE_KEYS.DISPLAY_SETTINGS);
const debouncedGoalsSave = optimizedStorage.createDebouncedSetter<GoalSettings>(STORAGE_KEYS.GOAL_SETTINGS);
const debouncedCameraSave = optimizedStorage.createDebouncedSetter<CameraSettings>(STORAGE_KEYS.CAMERA_SETTINGS);

useSettingsStore.subscribe(
  (state) => state.privacy,
  (privacy) => {
    debouncedPrivacySave(privacy).catch((error: any) => 
      console.error('Failed to auto-save privacy settings:', error)
    );
  }
);

useSettingsStore.subscribe(
  (state) => state.display,
  (display) => {
    debouncedDisplaySave(display).catch((error: any) => 
      console.error('Failed to auto-save display settings:', error)
    );
  }
);

useSettingsStore.subscribe(
  (state) => state.goals,
  (goals) => {
    debouncedGoalsSave(goals).catch((error: any) => 
      console.error('Failed to auto-save goal settings:', error)
    );
  }
);

useSettingsStore.subscribe(
  (state) => state.camera,
  (camera) => {
    debouncedCameraSave(camera).catch((error: any) => 
      console.error('Failed to auto-save camera settings:', error)
    );
  }
);

// Cleanup function to flush any pending saves when app is backgrounded
export const flushSettingsStorage = () => optimizedStorage.flush();