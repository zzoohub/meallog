import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage, devtools } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, ENV_CONFIG } from "@/constants";
import { performanceMonitor } from "@/lib/performance";
import type { User, UserPreferences, StoreState, AsyncAction } from "@/types";

interface UserActions {
  // Synchronous actions
  setUser: (user: Partial<User>) => void;
  clearError: () => void;
  resetStore: () => void;
  
  // Async actions with proper state management
  updateUser: (updates: Partial<User>) => Promise<void>;
  login: (userData: Pick<User, "id" | "username" | "phone">) => Promise<void>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
  setPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  
  // Computed getters
  isAuthenticated: () => boolean;
  getUserDisplayName: () => string;
}

interface UserStore extends StoreState<User | null>, UserActions {
  preferences: UserPreferences;
  
  // Async action states
  updateUserAction: AsyncAction<User>;
  loginAction: AsyncAction<User>;
  logoutAction: AsyncAction<null>;
  loadUserAction: AsyncAction<User>;
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
    allowAnalytics: !ENV_CONFIG.IS_DEVELOPMENT, // Respect development settings
  },
};

const initialAsyncAction = <T>(): AsyncAction<T> => ({
  pending: false,
  fulfilled: false,
  rejected: false,
  data: undefined,
  error: undefined,
});

export const useUserStore = create<UserStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // State
          data: null,
          loading: false,
          error: null,
          lastUpdated: null,
          preferences: initialPreferences,
          
          // Async action states
          updateUserAction: initialAsyncAction<User>(),
          loginAction: initialAsyncAction<User>(),
          logoutAction: initialAsyncAction<null>(),
          loadUserAction: initialAsyncAction<User>(),

          // Computed getters
          isAuthenticated: () => {
            const user = get().data;
            return Boolean(user?.isLoggedIn);
          },

          getUserDisplayName: () => {
            const user = get().data;
            return user?.username || user?.email || 'User';
          },

          // Sync actions
          setUser: (userData: Partial<User>) => {
            performanceMonitor.mark('user-store-set-user');
            
            set(state => ({
              data: state.data ? { ...state.data, ...userData } : { ...initialUser, ...userData },
              error: null,
              lastUpdated: new Date(),
            }));
            
            performanceMonitor.measure('user-store-set-user');
          },

          clearError: () => set({ error: null }),

          resetStore: () => {
            performanceMonitor.mark('user-store-reset');
            
            set({
              data: null,
              loading: false,
              error: null,
              lastUpdated: null,
              preferences: initialPreferences,
              updateUserAction: initialAsyncAction<User>(),
              loginAction: initialAsyncAction<User>(),
              logoutAction: initialAsyncAction<null>(),
              loadUserAction: initialAsyncAction<User>(),
            });
            
            performanceMonitor.measure('user-store-reset');
          },

          // Async actions with proper state management
          updateUser: async (updates: Partial<User>) => {
            const startTime = performanceMonitor.mark('user-store-update-user');
            
            try {
              // Set pending state
              set({
                loading: true,
                error: null,
                updateUserAction: { ...initialAsyncAction<User>(), pending: true },
              });

              const currentUser = get().data;
              if (!currentUser) {
                throw new Error("No user logged in");
              }

              const updatedUser: User = {
                ...currentUser,
                ...updates,
                updatedAt: new Date(),
              };

              // Optimistic update for better UX
              set({
                data: updatedUser,
                lastUpdated: new Date(),
              });

              // Save to storage
              await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

              // Set fulfilled state
              set({
                loading: false,
                updateUserAction: {
                  ...initialAsyncAction<User>(),
                  fulfilled: true,
                  data: updatedUser,
                },
              });
              
              performanceMonitor.measure('user-store-update-user', startTime);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Failed to update user";
              
              // Revert optimistic update on error
              const originalUser = get().data;
              set({
                loading: false,
                error: errorMessage,
                updateUserAction: {
                  ...initialAsyncAction<User>(),
                  rejected: true,
                  error: errorMessage,
                },
              });
              
              performanceMonitor.measure('user-store-update-user', startTime);
              throw error;
            }
          },

          login: async (userData: Pick<User, "id" | "username" | "phone">) => {
            const startTime = performanceMonitor.mark('user-store-login');
            
            try {
              set({
                loading: true,
                error: null,
                loginAction: { ...initialAsyncAction<User>(), pending: true },
              });

              const user: User = {
                ...userData,
                isLoggedIn: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // Save to storage
              await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

              set({
                data: user,
                loading: false,
                lastUpdated: new Date(),
                loginAction: {
                  ...initialAsyncAction<User>(),
                  fulfilled: true,
                  data: user,
                },
              });
              
              performanceMonitor.measure('user-store-login', startTime);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Login failed";
              set({
                loading: false,
                error: errorMessage,
                loginAction: {
                  ...initialAsyncAction<User>(),
                  rejected: true,
                  error: errorMessage,
                },
              });
              
              performanceMonitor.measure('user-store-login', startTime);
              throw error;
            }
          },

          logout: async () => {
            const startTime = performanceMonitor.mark('user-store-logout');
            
            try {
              set({
                loading: true,
                error: null,
                logoutAction: { ...initialAsyncAction<null>(), pending: true },
              });

              // Clear storage
              await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
                AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN),
                AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES),
              ]);

              set({
                data: null,
                loading: false,
                lastUpdated: new Date(),
                preferences: initialPreferences,
                logoutAction: {
                  ...initialAsyncAction<null>(),
                  fulfilled: true,
                  data: null,
                },
              });
              
              performanceMonitor.measure('user-store-logout', startTime);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Logout failed";
              set({
                loading: false,
                error: errorMessage,
                logoutAction: {
                  ...initialAsyncAction<null>(),
                  rejected: true,
                  error: errorMessage,
                },
              });
              
              performanceMonitor.measure('user-store-logout', startTime);
            }
          },

          loadUserFromStorage: async () => {
            const startTime = performanceMonitor.mark('user-store-load-from-storage');
            
            try {
              set({
                loading: true,
                error: null,
                loadUserAction: { ...initialAsyncAction<User>(), pending: true },
              });

              // Load user data and preferences in parallel
              const [userData, preferencesData] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
                AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES),
              ]);

              let user: User | null = null;
              if (userData) {
                user = JSON.parse(userData) as User;
                // Convert date strings back to Date objects
                user.createdAt = new Date(user.createdAt);
                user.updatedAt = new Date(user.updatedAt);
              }

              let preferences = initialPreferences;
              if (preferencesData) {
                preferences = { ...preferences, ...JSON.parse(preferencesData) };
              }

              set({
                data: user,
                preferences,
                loading: false,
                lastUpdated: new Date(),
                loadUserAction: {
                  ...initialAsyncAction<User>(),
                  fulfilled: true,
                  data: user,
                },
              });
              
              performanceMonitor.measure('user-store-load-from-storage', startTime);
            } catch (error) {
              console.error("Failed to load user from storage:", error);
              const errorMessage = error instanceof Error ? error.message : "Failed to load user";
              
              set({
                loading: false,
                error: errorMessage,
                loadUserAction: {
                  ...initialAsyncAction<User>(),
                  rejected: true,
                  error: errorMessage,
                },
              });
              
              performanceMonitor.measure('user-store-load-from-storage', startTime);
            }
          },

          setPreferences: async (updates: Partial<UserPreferences>) => {
            const startTime = performanceMonitor.mark('user-store-set-preferences');
            
            try {
              const newPreferences = { ...get().preferences, ...updates };

              // Optimistic update
              set({ preferences: newPreferences });

              // Save to storage
              await AsyncStorage.setItem(
                STORAGE_KEYS.USER_PREFERENCES,
                JSON.stringify(newPreferences)
              );
              
              performanceMonitor.measure('user-store-set-preferences', startTime);
            } catch (error) {
              console.error("Failed to save preferences:", error);
              
              // Revert optimistic update on error
              const originalPreferences = get().preferences;
              set({ preferences: originalPreferences });
              
              performanceMonitor.measure('user-store-set-preferences', startTime);
              throw error;
            }
          },
        }),
        {
          name: 'user-store',
          storage: createJSONStorage(() => AsyncStorage),
          partialize: (state) => ({
            data: state.data,
            preferences: state.preferences,
          }),
          version: 1,
          migrate: (persistedState: any, version: number) => {
            // Handle migration between versions
            if (version === 0) {
              // Migration from version 0 to 1
              return {
                ...persistedState,
                preferences: { ...initialPreferences, ...persistedState.preferences },
              };
            }
            return persistedState;
          },
        }
      )
    ),
    {
      name: 'UserStore',
      enabled: ENV_CONFIG.IS_DEVELOPMENT,
    }
  )
);

// Selectors for better performance
export const userSelectors = {
  user: (state: UserStore) => state.data,
  isAuthenticated: (state: UserStore) => state.isAuthenticated(),
  displayName: (state: UserStore) => state.getUserDisplayName(),
  preferences: (state: UserStore) => state.preferences,
  isLoading: (state: UserStore) => state.loading,
  error: (state: UserStore) => state.error,
  
  // Specific action states
  isUpdatingUser: (state: UserStore) => state.updateUserAction.pending,
  isLoggingIn: (state: UserStore) => state.loginAction.pending,
  isLoggingOut: (state: UserStore) => state.logoutAction.pending,
  isLoadingFromStorage: (state: UserStore) => state.loadUserAction.pending,
};

// Subscribe to user changes with performance monitoring
useUserStore.subscribe(
  userSelectors.user,
  (user, prevUser) => {
    // Only auto-save if user data actually changed
    if (user && user !== prevUser) {
      performanceMonitor.mark('user-store-auto-save');
      
      AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
        .then(() => performanceMonitor.measure('user-store-auto-save'))
        .catch(error => {
          console.error("Failed to auto-save user data:", error);
          performanceMonitor.measure('user-store-auto-save');
        });
    }
  },
  {
    fireImmediately: false,
    equalityFn: (a, b) => a?.id === b?.id && a?.updatedAt === b?.updatedAt,
  }
);

// Export hooks for specific selectors (better performance)
export const useUser = () => useUserStore(userSelectors.user);
export const useIsAuthenticated = () => useUserStore(userSelectors.isAuthenticated);
export const useUserDisplayName = () => useUserStore(userSelectors.displayName);
export const useUserPreferences = () => useUserStore(userSelectors.preferences);
export const useUserLoading = () => useUserStore(userSelectors.isLoading);
export const useUserError = () => useUserStore(userSelectors.error);
