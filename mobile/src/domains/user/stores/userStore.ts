import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { User, UserPreferences } from "@/types";

interface UserStore {
  user: User | null;
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: Partial<User>) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  login: (user: Pick<User, "id" | "username" | "phone">) => Promise<void>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
  setPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  clearError: () => void;
}

const initialUser: User = {
  id: "",
  username: "",
  phone: "",
  isLoggedIn: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const initialPreferences: UserPreferences = {
  language: "en",
  theme: "system",
  notifications: {
    posts: true,
    likes: true,
    follows: true,
  },
  privacy: {
    showLocation: false,
    allowAnalytics: true,
  },
};

export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    preferences: initialPreferences,
    isLoading: false,
    error: null,

    setUser: (userData: Partial<User>) => {
      set(state => ({
        user: state.user ? { ...state.user, ...userData } : { ...initialUser, ...userData },
        error: null,
      }));
    },

    updateUser: async (updates: Partial<User>) => {
      try {
        set({ isLoading: true, error: null });

        const currentUser = get().user;
        if (!currentUser) {
          throw new Error("No user logged in");
        }

        const updatedUser = {
          ...currentUser,
          ...updates,
          updatedAt: new Date(),
        };

        // Save to storage
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

        set({ user: updatedUser, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update user";
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    login: async (userData: Pick<User, "id" | "username" | "phone">) => {
      try {
        set({ isLoading: true, error: null });

        const user: User = {
          ...userData,
          isLoggedIn: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save to storage
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

        set({ user, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Login failed";
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    logout: async () => {
      try {
        set({ isLoading: true, error: null });

        // Clear storage
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
          AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN),
        ]);

        set({ user: null, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Logout failed";
        set({ error: errorMessage, isLoading: false });
      }
    },

    loadUserFromStorage: async () => {
      try {
        set({ isLoading: true, error: null });

        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (userData) {
          const user = JSON.parse(userData) as User;
          // Convert date strings back to Date objects
          user.createdAt = new Date(user.createdAt);
          user.updatedAt = new Date(user.updatedAt);
          set({ user });
        }

        // Load preferences
        const preferencesData = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
        if (preferencesData) {
          const preferences = JSON.parse(preferencesData) as UserPreferences;
          set({ preferences });
        }

        set({ isLoading: false });
      } catch (error) {
        console.error("Failed to load user from storage:", error);
        set({ isLoading: false });
      }
    },

    setPreferences: async (updates: Partial<UserPreferences>) => {
      try {
        const newPreferences = { ...get().preferences, ...updates };

        await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(newPreferences));

        set({ preferences: newPreferences });
      } catch (error) {
        console.error("Failed to save preferences:", error);
        throw error;
      }
    },

    clearError: () => set({ error: null }),
  })),
);

// Subscribe to user changes to automatically save preferences
useUserStore.subscribe(
  state => state.user,
  user => {
    if (user) {
      // Auto-save user data when it changes
      AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)).catch(error =>
        console.error("Failed to auto-save user data:", error),
      );
    }
  },
);
