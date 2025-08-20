import { ReactNode, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';
import { changeLanguage } from '@/lib/i18n';
import { useUserStore } from '@/domains/user/stores/userStore';
import { useSettingsStore, flushSettingsStorage } from '@/domains/settings/stores/settingsStore';
import { API_CONFIG } from '@/constants';
import { bundleManager } from '@/lib/bundle';
import ErrorBoundary from '@/components/ErrorBoundary';

// Configure React Query client with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: API_CONFIG.CACHE_DURATION,
      gcTime: API_CONFIG.CACHE_DURATION * 2,
      retry: (failureCount, error: any) => {
        // Don't retry for 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < API_CONFIG.RETRY_ATTEMPTS;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppInitializer() {
  const loadUserFromStorage = useUserStore(state => state.loadUserFromStorage);
  const loadSettings = useSettingsStore(state => state.loadSettings);
  const displayLanguage = useSettingsStore(state => state.display.language);

  useEffect(() => {
    // Initialize user data and settings from storage on app start
    Promise.all([
      loadUserFromStorage(),
      loadSettings(),
    ]).catch(error => {
      console.error('Failed to initialize app data:', error);
    });

    // Preload critical modules for better performance
    bundleManager.preloadCriticalModules();

    // Setup app lifecycle handlers for React Native
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Flush pending settings saves when app goes to background
        flushSettingsStorage();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [loadUserFromStorage, loadSettings]);

  // Sync language setting with i18n
  useEffect(() => {
    if (displayLanguage) {
      changeLanguage(displayLanguage);
    }
  }, [displayLanguage]);

  return null;
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log critical errors to crash reporting service
    if (__DEV__) {
      console.error('App-level error:', error, errorInfo);
    } else {
      // In production, use crash reporting service like Crashlytics
      // crashlytics().recordError(error);
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AppInitializer />
          {children}
        </I18nextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
