import { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';
import { useUserStore } from '@/domains/user/stores/userStore';
import { useSettingsStore } from '@/domains/settings/stores/settingsStore';
import { API_CONFIG } from '@/constants';

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

  useEffect(() => {
    // Initialize user data and settings from storage on app start
    Promise.all([
      loadUserFromStorage(),
      loadSettings(),
    ]).catch(error => {
      console.error('Failed to initialize app data:', error);
    });
  }, [loadUserFromStorage, loadSettings]);

  return null;
}

export default function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AppInitializer />
        {children}
      </I18nextProvider>
    </QueryClientProvider>
  );
}
